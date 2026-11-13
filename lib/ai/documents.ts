import { readFileSync } from 'fs';
import mammoth from 'mammoth';

export interface ExtractionResult {
  text: string;
  success: boolean;
  error?: string;
}

async function loadPdfParse() {
  const mod = await import('pdf-parse');
  return (mod as any).default ?? mod;
}

export async function extractDocumentText(filePath: string, mimeType: string): Promise<ExtractionResult> {
  try {
    const buffer = readFileSync(filePath);
    if (mimeType === 'application/pdf') {
      const parse = await loadPdfParse();
      const data = await parse(buffer);
      return { text: data.text ?? '', success: true };
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
      const data = await mammoth.extractRawText({ buffer });
      return { text: data.value ?? '', success: true };
    }
    if (mimeType === 'text/plain') {
      return { text: buffer.toString('utf8'), success: true };
    }
    return { text: '', success: false, error: `Unsupported file type: ${mimeType}` };
  } catch (err: any) {
    return { text: '', success: false, error: err?.message ?? 'Extraction failed' };
  }
}

export function sanitizeExtractedText(text: string): string {
  return text.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
}
