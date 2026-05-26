import pdf from 'pdf-parse/lib/pdf-parse.js';

export async function extractPdfText(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input || '');
  if (!buffer.length) return '';
  const data = await pdf(buffer);
  return data.text || '';
}
