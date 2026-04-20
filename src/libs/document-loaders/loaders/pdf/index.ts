import { splitText } from '../../splitter';
import { type DocumentChunk } from '../../types';
import { loaderConfig } from '../config';

export const PdfLoader = async (fileBlob: Blob): Promise<DocumentChunk[]> => {
  const pdfParse = (await import('pdf-parse')).default;

  const buffer = Buffer.from(await fileBlob.arrayBuffer());
  const data = await pdfParse(buffer);

  // Split by pages using form feed character, or treat as single page
  const pages: string[] = data.text
    ? data.text.split(/\f/).filter((page: string) => page.trim().length > 0)
    : [];

  const chunks: DocumentChunk[] = [];

  for (const [index, pageText] of pages.entries()) {
    const pageChunks = splitText(pageText.trim(), loaderConfig);
    for (const chunk of pageChunks) {
      chunks.push({
        metadata: {
          ...chunk.metadata,
          loc: { pageNumber: index + 1 },
        },
        pageContent: chunk.pageContent,
      });
    }
  }

  return chunks;
};
