import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export async function extractPdfText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  return data.text || '';
}
