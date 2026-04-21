import { CveAnalyzerIdentifier } from '@lobechat/builtin-tool-cve-analyzer';
import debug from 'debug';

import { getServerDefaultFilesConfig } from '@/server/globalConfig';

import { type ServerRuntimeRegistration } from './types';

const log = debug('lobe-server:cve-analyzer');

// ─── Milvus REST helpers ──────────────────────────────────────────────────────

const DB_NAME = 'sec_dev';
const COLLECTION = 'cve_info';
const OUTPUT_FIELDS = ['cve_id', 'cnnvd_id', 'description', 'product_info', 'solutions'];

function milvusUrl() {
  const base = process.env.CVE_MILVUS_URL ?? 'http://localhost:19530';
  const url = base.replace(/\/$/, '');
  log('Milvus URL: %s', url);
  return url;
}

async function milvusQuery(filterExpr: string, limit = 20) {
  log('Milvus query - filter: %s, limit: %d', filterExpr, limit);
  const res = await fetch(`${milvusUrl()}/v2/vectordb/entities/query`, {
    body: JSON.stringify({
      collectionName: COLLECTION,
      filter: filterExpr,
      limit,
      outputFields: OUTPUT_FIELDS,
      dbName: DB_NAME,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!res.ok) {
    log('Milvus query failed: %d', res.status);
    throw new Error(`Milvus query failed: ${res.status}`);
  }
  const json = await res.json();
  const data = (json.data ?? []) as Record<string, any>[];
  log('Milvus query returned %d records', data.length);
  return data;
}

async function milvusCount(filterExpr: string) {
  log('Milvus count - filter: %s', filterExpr || '(empty)');
  const res = await fetch(`${milvusUrl()}/v2/vectordb/entities/query`, {
    body: JSON.stringify({
      collectionName: COLLECTION,
      filter: filterExpr || '',
      outputFields: ['count(*)'],
      dbName: DB_NAME,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!res.ok) {
    log('Milvus count failed: %d', res.status);
    throw new Error(`Milvus count failed: ${res.status}`);
  }
  const json = await res.json();
  const count = (json.data?.[0]?.['count(*)'] ?? 0) as number;
  log('Milvus count result: %d', count);
  return count;
}

async function milvusVectorSearch(vector: number[], limit: number, filterExpr?: string) {
  log('Milvus vector search - limit: %d, filter: %s', limit, filterExpr || '(none)');
  const res = await fetch(`${milvusUrl()}/v2/vectordb/entities/search`, {
    body: JSON.stringify({
      annsField: 'embedding',
      collectionName: COLLECTION,
      data: [vector],
      filter: filterExpr,
      limit,
      outputFields: OUTPUT_FIELDS,
      dbName: DB_NAME,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!res.ok) {
    log('Milvus vector search failed: %d', res.status);
    throw new Error(`Milvus search failed: ${res.status}`);
  }
  const json = await res.json();
  const data = (json.data?.[0] ?? []) as Array<Record<string, any> & { distance: number }>;
  log('Milvus vector search returned %d results', data.length);
  return data;
}

// ─── Embedding helper ─────────────────────────────────────────────────────────

async function generateEmbedding(text: string): Promise<number[]> {
  log('Generating embedding for text (length: %d)', text.length);
  const filesConfig = getServerDefaultFilesConfig();
  const { model, dimensions } = filesConfig.embeddingModel;
  const baseURL = process.env.OPENAI_PROXY_URL ?? 'http://localhost/v1';
  const apiKey = process.env.OPENAI_API_KEY ?? '';

  log(
    'Embedding config - model: %s, dimensions: %d, baseURL: %s',
    model,
    dimensions ?? 1024,
    baseURL,
  );

  const res = await fetch(`${baseURL}/embeddings`, {
    body: JSON.stringify({
      dimensions: dimensions ?? 1024,
      input: text,
      model,
    }),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  if (!res.ok) {
    log('Embedding API failed: %d', res.status);
    throw new Error(`Embedding API failed: ${res.status}`);
  }
  const json = await res.json();
  const embedding = json.data[0].embedding as number[];
  log('Embedding generated, dimension: %d', embedding.length);
  return embedding;
}

// ─── Rerank helper ────────────────────────────────────────────────────────────

async function rerank(
  query: string,
  documents: string[],
  topN: number,
): Promise<Array<{ index: number; relevanceScore: number }>> {
  log('Rerank - query: %s, documents: %d, topN: %d', query, documents.length, topN);
  const filesConfig = getServerDefaultFilesConfig();
  const { model } = filesConfig.rerankerModel;
  const baseURL = (process.env.OPENAI_PROXY_URL ?? 'http://localhost/v1').replace(/\/v1$/, '');
  const apiKey = process.env.OPENAI_API_KEY ?? '';

  log('Rerank config - model: %s, baseURL: %s', model, baseURL);

  const res = await fetch(`${baseURL}/v1/rerank`, {
    body: JSON.stringify({
      documents,
      model,
      query,
      return_documents: false,
      top_n: topN,
    }),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  if (!res.ok) {
    log('Rerank API failed: %d', res.status);
    throw new Error(`Rerank API failed: ${res.status}`);
  }
  const json = await res.json();
  const results = (json.results as any[]).map((r) => ({
    index: r.index,
    relevanceScore: r.relevance_score,
  }));
  log('Rerank returned %d results', results.length);
  return results;
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatRecords(records: Record<string, any>[]) {
  if (records.length === 0) return '未找到相关漏洞信息。';
  return records
    .map((r) => {
      const id = [r.cve_id, r.cnnvd_id].filter(Boolean).join(' / ') || '未知';
      const score = r.relevanceScore != null ? `\n相关度: ${r.relevanceScore.toFixed(4)}` : '';
      return [
        `### ${id}`,
        r.description ? `**描述:** ${r.description}` : '',
        r.product_info ? `**受影响产品:** ${r.product_info}` : '',
        r.solutions ? `**修复建议:** ${r.solutions}` : '',
        score,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n---\n\n');
}

// ─── Runtime factory ──────────────────────────────────────────────────────────

const createCveRuntime = () => ({
  getStats: async (args: { groupByYear?: boolean; product?: string; year?: string }) => {
    log('getStats called with args: %O', args);
    try {
      if (args.groupByYear) {
        log('Grouping stats by year');
        const years = ['2021', '2022', '2023', '2024', '2025'];
        const counts = await Promise.all(years.map((y) => milvusCount(`cve_id like "CVE-${y}-%"`)));
        const rows = years.map((y, i) => `| ${y} | ${counts[i].toLocaleString()} |`).join('\n');
        log('Year-based stats completed');
        return {
          content: `## 漏洞数量统计（按年度）\n\n| 年份 | 数量 |\n|------|------|\n${rows}`,
          success: true,
        };
      }

      const parts: string[] = [];
      if (args.year) parts.push(`cve_id like "CVE-${args.year}-%"`);
      if (args.product) parts.push(`product_info like "%${args.product}%"`);
      const filter = parts.join(' and ');

      log('Filter expression: %s', filter || '(empty)');
      const count = await milvusCount(filter);
      const desc = [
        args.year ? `年份: ${args.year}` : '',
        args.product ? `产品: ${args.product}` : '',
      ]
        .filter(Boolean)
        .join(', ');

      log('Stats result - count: %d, description: %s', count, desc);
      return {
        content: `漏洞数量${desc ? `（${desc}）` : ''}: **${count.toLocaleString()}** 条`,
        success: true,
      };
    } catch (e) {
      log('getStats error: %O', e);
      return { content: `查询统计失败: ${(e as Error).message}`, success: false };
    }
  },

  lookupVulnerability: async (args: { ids: string[] }) => {
    log('lookupVulnerability called with ids: %O', args.ids);
    try {
      const cveIds = args.ids.filter((id) => /^CVE-/i.test(id));
      const cnnvdIds = args.ids.filter((id) => /^CNNVD-/i.test(id));
      log('Parsed IDs - CVE: %O, CNNVD: %O', cveIds, cnnvdIds);

      const parts: string[] = [];
      if (cveIds.length > 0)
        parts.push(`cve_id in [${cveIds.map((id) => `"${id.toUpperCase()}"`).join(',')}]`);
      if (cnnvdIds.length > 0)
        parts.push(`cnnvd_id in [${cnnvdIds.map((id) => `"${id.toUpperCase()}"`).join(',')}]`);

      if (parts.length === 0) {
        log('No valid IDs provided');
        return { content: '请提供有效的 CVE 或 CNNVD 编号', success: false };
      }

      const filterExpr = parts.join(' or ');
      log('Filter expression: %s', filterExpr);
      const rawRecords = await milvusQuery(filterExpr, args.ids.length * 2);
      log('lookupVulnerability completed, found %d records', rawRecords.length);
      const records = rawRecords.map((r) => ({
        cnnvd_id: r.cnnvd_id as string | undefined,
        cve_id: r.cve_id as string | undefined,
        description: r.description as string | undefined,
        product_info: r.product_info as string | undefined,
        solutions: r.solutions as string | undefined,
      }));
      return {
        content: formatRecords(rawRecords),
        records,
        state: { ids: args.ids, records, total: records.length },
        success: true,
      };
    } catch (e) {
      log('lookupVulnerability error: %O', e);
      return { content: `查询失败: ${(e as Error).message}`, success: false };
    }
  },

  searchVulnerability: async (args: { product?: string; query: string; topK?: number }) => {
    log(
      'searchVulnerability called - query: %s, product: %s, topK: %d',
      args.query,
      args.product || '(none)',
      args.topK ?? 10,
    );
    const filesConfig = getServerDefaultFilesConfig();
    const candidatePoolSize = filesConfig.candidatePoolSize ?? 60;
    const rerankTopK = filesConfig.rerankTopK ?? 15;
    const topK = Math.min(args.topK ?? 10, 50);

    log(
      'Config - candidatePoolSize: %d, rerankTopK: %d, topK: %d',
      candidatePoolSize,
      rerankTopK,
      topK,
    );

    try {
      // 1. Generate query embedding
      log('Step 1: Generating embedding');
      const vector = await generateEmbedding(args.query);

      // 2. Vector search in Milvus
      const filterExpr = args.product ? `product_info like "%${args.product}%"` : undefined;
      log('Step 2: Vector search with filter: %s', filterExpr || '(none)');
      const candidates = await milvusVectorSearch(vector, candidatePoolSize, filterExpr);

      if (candidates.length === 0) {
        log('No candidates found, returning early');
        return { content: '未找到相关漏洞信息。', success: true };
      }

      log('Found %d candidates before filtering', candidates.length);

      // 3. Filter by min_similarity
      const minSim = filesConfig.minSimilarity ?? 0.3;
      const filtered = candidates.filter((c) => 1 - c.distance >= minSim);
      const pool = filtered.length > 0 ? filtered : candidates;
      log('After similarity filter (minSim: %f): %d -> %d', minSim, candidates.length, pool.length);

      // 4. Rerank if pool exceeds topK
      let final: Array<Record<string, any> & { relevanceScore?: number }>;
      if (pool.length > topK) {
        log('Step 4: Reranking (pool: %d, topK: %d)', pool.length, topK);
        try {
          const docs = pool.map((c) =>
            `${c.description ?? ''} ${c.product_info ?? ''}`.trim().slice(0, 512),
          );
          const rerankResults = await rerank(args.query, docs, Math.min(rerankTopK, topK));
          final = rerankResults.map((r) => ({
            ...pool[r.index],
            relevanceScore: r.relevanceScore,
          }));
          log('Reranking completed, final results: %d', final.length);
        } catch (rerankError) {
          // Rerank failure degrades gracefully to vector-distance order
          log('Rerank failed, falling back to vector distance: %O', rerankError);
          final = pool.slice(0, topK).map((c) => ({
            ...c,
            relevanceScore: 1 - c.distance,
          }));
        }
      } else {
        log('Pool size (%d) <= topK (%d), skipping rerank', pool.length, topK);
        final = pool.slice(0, topK).map((c) => ({ ...c, relevanceScore: 1 - c.distance }));
      }

      log('searchVulnerability completed, returning %d results', final.length);
      const records = final.map((r) => ({
        cnnvd_id: r.cnnvd_id as string | undefined,
        cve_id: r.cve_id as string | undefined,
        description: r.description as string | undefined,
        product_info: r.product_info as string | undefined,
        relevanceScore: r.relevanceScore,
        solutions: r.solutions as string | undefined,
      }));
      return {
        content: formatRecords(final),
        records,
        state: { query: args.query, records, total: records.length },
        success: true,
      };
    } catch (e) {
      log('searchVulnerability error: %O', e);
      return { content: `搜索失败: ${(e as Error).message}`, success: false };
    }
  },
});

export const cveAnalyzerRuntime: ServerRuntimeRegistration = {
  factory: () => createCveRuntime(),
  identifier: CveAnalyzerIdentifier,
};
