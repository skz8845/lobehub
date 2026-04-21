-- RAG optimization: HNSW vector index on embeddings table + BM25 index on chunks table
-- HNSW gives ~10ms ANN search vs seconds for sequential scan at scale.
-- BM25 on chunks enables keyword/hybrid search to complement vector recall.

-- 1. HNSW index on embeddings.embeddings (cosine distance)
-- m=16 controls graph connectivity; ef_construction=64 balances build time vs recall.
DROP INDEX IF EXISTS embeddings_vec_hnsw_idx;--> statement-breakpoint
CREATE INDEX embeddings_vec_hnsw_idx ON embeddings
USING hnsw (embeddings vector_cosine_ops)
WITH (m = 16, ef_construction = 64);--> statement-breakpoint

-- 2. BM25 index on chunks table for keyword/hybrid search
DROP INDEX IF EXISTS chunks_bm25_idx;--> statement-breakpoint
CREATE INDEX chunks_bm25_idx ON chunks
USING bm25 (id, text, type, user_id)
WITH (
  key_field = 'id',
  text_fields = '{
    "text":    {"tokenizer": {"type": "icu"}},
    "type":    {"fast": true, "tokenizer": {"type": "keyword"}},
    "user_id": {"fast": true, "tokenizer": {"type": "keyword"}}
  }'
);
