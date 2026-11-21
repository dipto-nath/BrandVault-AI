import { NextRequest } from 'next/server';
import { withAuth, ok, fail } from '@/lib/api/handler';
import { extractDocumentText, sanitizeExtractedText } from '@/lib/ai/documents';

export const POST = withAuth(async (ctx, req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return fail('VALIDATION_ERROR', 'No document file provided', 400);
    }

    if (file.size > 15 * 1024 * 1024) {
      return fail('VALIDATION_ERROR', 'File size exceeds maximum limit of 15MB', 400);
    }

    const mimeType = file.type || 'application/octet-stream';
    const isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx = mimeType.includes('word') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');
    const isTxt = mimeType === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

    if (!isPdf && !isDocx && !isTxt) {
      return fail('VALIDATION_ERROR', 'Please upload a PDF, Word document (.docx), or text file', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractDocumentText(buffer, isPdf ? 'application/pdf' : mimeType);
    if (!extraction.success) {
      throw new Error(extraction.error || 'Failed to extract text from document');
    }

    const text = sanitizeExtractedText(extraction.text);
    const lines = text.split(/\r?\n/).filter(Boolean);

    return ok({
      text,
      filename: file.name,
      charCount: text.length,
      lineCount: lines.length,
    });
  } catch (err: any) {
    console.error('Extract text from document error:', err);
    return fail('EXTRACTION_ERROR', err?.message ?? 'Failed to extract document text', 500);
  }
});
