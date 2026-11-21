import { readFileSync } from 'fs';
import mammoth from 'mammoth';

export interface ExtractionResult {
  text: string;
  success: boolean;
  error?: string;
}

async function loadPdfParse() {
  const mod = await import('pdf-parse');
  return mod;
}

export async function extractDocumentText(filePath: string, mimeType: string): Promise<ExtractionResult> {
  try {
    const buffer = readFileSync(filePath);

    if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
      const mod: any = await loadPdfParse();

      // 1. Check for pdf-parse v2 (class PDFParse)
      const PDFParseClass = mod.PDFParse || (mod.default && mod.default.PDFParse);
      if (PDFParseClass) {
        const uint8 = new Uint8Array(buffer);
        const parser = new PDFParseClass(uint8);
        await parser.load();
        const res = await parser.getText();
        let fullText = '';
        if (typeof res === 'string') {
          fullText = res;
        } else if (res && typeof res === 'object') {
          if (typeof res.text === 'string') {
            fullText = res.text;
          } else if (Array.isArray(res.pages)) {
            fullText = res.pages.map((p: any) => p.text || '').join('\n');
          }
        }
        return { text: fullText.trim(), success: true };
      }

      // 2. Fallback to pdf-parse v1 (function)
      const parseFn = typeof mod === 'function' ? mod : (typeof mod.default === 'function' ? mod.default : null);
      if (parseFn) {
        const data = await parseFn(buffer);
        return { text: (data.text ?? '').trim(), success: true };
      }

      return { text: '', success: false, error: 'Could not initialize PDF parser' };
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      filePath.toLowerCase().endsWith('.docx') ||
      filePath.toLowerCase().endsWith('.doc')
    ) {
      const data = await mammoth.extractRawText({ buffer });
      return { text: data.value ?? '', success: true };
    }

    if (mimeType === 'text/plain' || filePath.toLowerCase().endsWith('.txt')) {
      return { text: buffer.toString('utf8'), success: true };
    }

    return { text: '', success: false, error: `Unsupported file type: ${mimeType}` };
  } catch (err: any) {
    console.error('Document extraction error:', err);
    return { text: '', success: false, error: err?.message ?? 'Extraction failed' };
  }
}

export function sanitizeExtractedText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/(\r?\n){3,}/g, '\n\n')
    .trim();
}
