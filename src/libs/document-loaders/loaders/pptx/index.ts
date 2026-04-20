import { splitText } from '../../splitter';
import { type DocumentChunk } from '../../types';
import { loaderConfig } from '../config';

export const PPTXLoader = async (fileBlob: Blob | string): Promise<DocumentChunk[]> => {
  const { parseOfficeAsync } = await import('officeparser');

  const buffer =
    typeof fileBlob === 'string'
      ? Buffer.from(fileBlob)
      : Buffer.from(await fileBlob.arrayBuffer());

  const text = await parseOfficeAsync(buffer);

  return splitText(text, loaderConfig);
};
