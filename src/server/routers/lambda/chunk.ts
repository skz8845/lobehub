import { DEFAULT_FILE_EMBEDDING_MODEL_ITEM, DEFAULT_FILE_RERANK_MODEL_ITEM } from '@lobechat/const';
import { type ChatSemanticSearchChunk, type FileSearchResult } from '@lobechat/types';
import { RequestTrigger, SemanticSearchSchema } from '@lobechat/types';
import { TRPCError } from '@trpc/server';
import { inArray } from 'drizzle-orm';
import pMap from 'p-map';
import { z } from 'zod';

import { AsyncTaskModel } from '@/database/models/asyncTask';
import { ChunkModel } from '@/database/models/chunk';
import { DocumentModel } from '@/database/models/document';
import { EmbeddingModel } from '@/database/models/embedding';
import { FileModel } from '@/database/models/file';
import { MessageModel } from '@/database/models/message';
import { knowledgeBaseFiles } from '@/database/schemas';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';
import { getServerDefaultFilesConfig } from '@/server/globalConfig';
import { initModelRuntimeFromDB } from '@/server/modules/ModelRuntime';
import { ChunkService } from '@/server/services/chunk';
import { DocumentService } from '@/server/services/document';

const chunkProcedure = authedProcedure.use(serverDatabase).use(async (opts) => {
  const { ctx } = opts;

  return opts.next({
    ctx: {
      asyncTaskModel: new AsyncTaskModel(ctx.serverDB, ctx.userId),
      chunkModel: new ChunkModel(ctx.serverDB, ctx.userId),
      chunkService: new ChunkService(ctx.serverDB, ctx.userId),
      documentModel: new DocumentModel(ctx.serverDB, ctx.userId),
      documentService: new DocumentService(ctx.serverDB, ctx.userId),
      embeddingModel: new EmbeddingModel(ctx.serverDB, ctx.userId),
      fileModel: new FileModel(ctx.serverDB, ctx.userId),
      messageModel: new MessageModel(ctx.serverDB, ctx.userId),
    },
  });
});

/**
 * Group chunks by file and calculate relevance scores.
 * Does NOT hard-cap chunks per file — all matched chunks are kept for context.
 */
const groupAndRankFiles = (chunks: ChatSemanticSearchChunk[], topK: number): FileSearchResult[] => {
  const fileMap = new Map<string, FileSearchResult>();

  for (const chunk of chunks) {
    const fileId = chunk.fileId || 'unknown';
    const fileName = chunk.fileName || `File ${fileId}`;

    if (!fileMap.has(fileId)) {
      fileMap.set(fileId, {
        fileId,
        fileName,
        relevanceScore: 0,
        topChunks: [],
      });
    }

    fileMap.get(fileId)!.topChunks.push({
      id: chunk.id,
      similarity: chunk.similarity,
      text: chunk.text || '',
    });
  }

  // Calculate relevance score: max * 0.6 + avg_top5 * 0.4
  for (const fileResult of fileMap.values()) {
    fileResult.topChunks.sort((a, b) => b.similarity - a.similarity);
    const topSlice = fileResult.topChunks.slice(0, 5);
    const maxSim = topSlice[0]?.similarity ?? 0;
    const avgSim =
      topSlice.length > 0 ? topSlice.reduce((s, c) => s + c.similarity, 0) / topSlice.length : 0;
    fileResult.relevanceScore = maxSim * 0.6 + avgSim * 0.4;
  }

  return Array.from(fileMap.values())
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);
};

/**
 * Reciprocal Rank Fusion — merges vector and BM25 ranked lists without needing score calibration.
 * k=60 is the standard constant from the original RRF paper.
 */
const reciprocalRankFusion = <T extends { id: string }>(
  vectorResults: T[],
  bm25Results: { id: string }[],
  k = 60,
): T[] => {
  const scores = new Map<string, number>();
  const itemById = new Map<string, T>();

  for (const [rank, item] of vectorResults.entries()) {
    scores.set(item.id, (scores.get(item.id) ?? 0) + 1 / (k + rank + 1));
    itemById.set(item.id, item);
  }

  for (const [rank, item] of bm25Results.entries()) {
    scores.set(item.id, (scores.get(item.id) ?? 0) + 1 / (k + rank + 1));
  }

  return [...scores.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => itemById.get(id))
    .filter(Boolean) as T[];
};

export const chunkRouter = router({
  createEmbeddingChunksTask: chunkProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const asyncTaskId = await ctx.chunkService.asyncEmbeddingFileChunks(input.id);

      return { id: asyncTaskId, success: true };
    }),

  createParseFileTask: chunkProcedure
    .input(
      z.object({
        id: z.string(),
        skipExist: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const asyncTaskId = await ctx.chunkService.asyncParseFileToChunks(input.id, input.skipExist);

      return { id: asyncTaskId, success: true };
    }),

  getChunksByFileId: chunkProcedure
    .input(
      z.object({
        cursor: z.number().nullish(),
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return {
        items: await ctx.chunkModel.findByFileId(input.id, input.cursor || 0),
        nextCursor: input.cursor ? input.cursor + 1 : 1,
      };
    }),

  getFileContents: chunkProcedure
    .input(
      z.object({
        fileIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await pMap(
        input.fileIds,
        async (fileId) => {
          // 1. Find file information
          const file = await ctx.fileModel.findById(fileId);
          if (!file) {
            return {
              content: '',
              error: 'File not found',
              fileId,
              filename: `Unknown file ${fileId}`,
            };
          }

          // 2. Find existing parsed document
          let document:
            | {
                content: string | null;
                metadata: Record<string, any> | null;
              }
            | undefined = await ctx.documentModel.findByFileId(fileId);

          // 3. If not exists, parse the file
          if (!document) {
            try {
              document = await ctx.documentService.parseFile(fileId);
            } catch (error) {
              return {
                content: '',
                error: `Failed to parse file: ${(error as Error).message}`,
                fileId,
                filename: file.name,
              };
            }
          }

          // 4. Calculate file statistics
          const content = document.content || '';
          const lines = content.split('\n');
          const totalLineCount = lines.length;
          const totalCharCount = content.length;
          const preview = lines.slice(0, 5).join('\n');

          // 5. Return content with details
          return {
            content,
            fileId,
            filename: file.name,
            metadata: document.metadata,
            preview,
            totalCharCount,
            totalLineCount,
          };
        },
        { concurrency: 3 },
      );
    }),

  retryParseFileTask: chunkProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.fileModel.findById(input.id);

      if (!result) return;

      // 1. delete the previous task if exist
      if (result.chunkTaskId) {
        await ctx.asyncTaskModel.delete(result.chunkTaskId);
      }

      // 2. create a new asyncTask for chunking
      const asyncTaskId = await ctx.chunkService.asyncParseFileToChunks(input.id);

      return { id: asyncTaskId, success: true };
    }),

  semanticSearch: chunkProcedure
    .input(
      z.object({
        fileIds: z.array(z.string()).optional(),
        query: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const filesConfig = getServerDefaultFilesConfig();
      const { model, provider, dimensions } =
        filesConfig.embeddingModel || DEFAULT_FILE_EMBEDDING_MODEL_ITEM;
      const embeddingDimensions = dimensions ?? 1024;
      const agentRuntime = await initModelRuntimeFromDB(ctx.serverDB, ctx.userId, provider);

      const embeddingVectors = await agentRuntime.embeddings(
        { dimensions: embeddingDimensions, input: input.query, model },
        { metadata: { trigger: RequestTrigger.SemanticSearch }, user: ctx.userId },
      );

      return ctx.chunkModel.semanticSearch({
        embedding: embeddingVectors![0],
        fileIds: input.fileIds,
        minSimilarity: filesConfig.minSimilarity,
        query: input.query,
      });
    }),

  semanticSearchForChat: chunkProcedure
    .input(SemanticSearchSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const filesConfig = getServerDefaultFilesConfig();
        const { model, provider, dimensions } =
          filesConfig.embeddingModel || DEFAULT_FILE_EMBEDDING_MODEL_ITEM;

        const embeddingDimensions = dimensions ?? 1024;
        const finalTopK = input.topK ?? 15;
        const candidatePoolSize = filesConfig.candidatePoolSize ?? 60;
        const minSimilarity = filesConfig.minSimilarity ?? 0;
        const queryMode = filesConfig.queryMode ?? 'hybrid';

        const modelRuntime = await initModelRuntimeFromDB(ctx.serverDB, ctx.userId, provider);

        // Prefer the tail of a long query (most recent user turn is most relevant)
        const query = input.query.length > 8000 ? input.query.slice(-8000) : input.query;

        const embeddingVectors = await modelRuntime.embeddings(
          { dimensions: embeddingDimensions, input: query, model },
          { metadata: { trigger: RequestTrigger.SemanticSearch }, user: ctx.userId },
        );

        const embedding = embeddingVectors![0];

        let finalFileIds = input.fileIds ?? [];

        if (input.knowledgeIds && input.knowledgeIds.length > 0) {
          const knowledgeFiles = await ctx.serverDB.query.knowledgeBaseFiles.findMany({
            where: inArray(knowledgeBaseFiles.knowledgeBaseId, input.knowledgeIds),
          });
          finalFileIds = knowledgeFiles.map((f) => f.fileId).concat(finalFileIds);
        }

        // Fetch wide candidate pool; run BM25 in parallel when hybrid mode is active
        const [vectorChunks, bm25Chunks] = await Promise.all([
          ctx.chunkModel.semanticSearchForChat({
            embedding,
            fileIds: finalFileIds,
            minSimilarity,
            query,
            topK: candidatePoolSize,
          }),
          queryMode === 'hybrid' || queryMode === 'full_text'
            ? ctx.chunkModel.bm25SearchForChat({
                fileIds: finalFileIds,
                query,
                topK: candidatePoolSize,
              })
            : Promise.resolve([]),
        ]);

        // RRF fusion merges vector and BM25 ranked lists
        let mergedChunks = vectorChunks;
        if (bm25Chunks.length > 0) {
          mergedChunks = reciprocalRankFusion(vectorChunks, bm25Chunks);
        }

        // Rerank merged candidates if a reranker is configured
        const rerankConfig = filesConfig.rerankerModel || DEFAULT_FILE_RERANK_MODEL_ITEM;
        const rerankTopK = filesConfig.rerankTopK ?? finalTopK;
        let chunks = mergedChunks;

        if (rerankConfig?.model && rerankConfig?.provider && mergedChunks.length > rerankTopK) {
          try {
            const rerankRuntime = await initModelRuntimeFromDB(
              ctx.serverDB,
              ctx.userId,
              rerankConfig.provider,
            );
            const rerankResults = await rerankRuntime.rerank?.(
              {
                documents: mergedChunks.map((c) => c.text ?? ''),
                model: rerankConfig.model,
                query,
                topN: rerankTopK,
              },
              { user: ctx.userId },
            );

            if (rerankResults && rerankResults.length > 0) {
              chunks = rerankResults.map((r) => mergedChunks[r.index]).filter(Boolean);
            } else {
              chunks = mergedChunks.slice(0, rerankTopK);
            }
          } catch {
            // Rerank failure is non-fatal — fall back to RRF-ordered candidates
            chunks = mergedChunks.slice(0, rerankTopK);
          }
        } else {
          chunks = mergedChunks.slice(0, finalTopK);
        }

        // Post-filter by similarity threshold after reranking
        if (minSimilarity > 0) {
          const filtered = chunks.filter((c) => (c.similarity ?? 0) >= minSimilarity);
          if (filtered.length > 0) chunks = filtered;
        }

        const fileResults = groupAndRankFiles(chunks, finalTopK);

        return { chunks, fileResults };
      } catch (e) {
        console.error(e);

        const error = e as any;
        const errorType = error.errorType;

        if (errorType === 'InvalidProviderAPIKey') {
          throw new TRPCError({
            code: 'METHOD_NOT_SUPPORTED',
            message: error.message || 'Invalid API key for embedding provider',
          });
        }

        if (errorType === 'ProviderBizError') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'Provider service error',
          });
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || errorType || 'Failed to perform semantic search',
        });
      }
    }),
});
