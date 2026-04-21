const getLoaderConfig = () => ({
  chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP ?? 150),
  chunkSize: Number(process.env.RAG_CHUNK_SIZE ?? 1000),
});

export const loaderConfig = getLoaderConfig();
