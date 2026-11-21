import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withAdmin, ok, fail } from '@/lib/api/handler';
import { storage } from '@/lib/db/adaptor';
import { generateJson, extractJsonBlock } from '@/lib/ai/provider';
import { extractDocumentText, sanitizeExtractedText } from '@/lib/ai/documents';
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), '.brandvault', 'uploads');

interface ExtractedProduct {
  name: string;
  category: string;
  model_or_version: string;
  launch_date: string | null;
  status: 'ACTIVE' | 'DRAFT';
  description: string;
}

interface ExtractedFact {
  fact_code: string;
  title: string;
  fact_text: string;
  entity_name: string | null;
  source_reference: string | null;
  source_excerpt: string | null;
  verification_status: 'APPROVED' | 'PENDING';
  effective_from: string | null;
  expires_at: string | null;
  notes: string | null;
}

interface ExtractionResult {
  product: ExtractedProduct;
  facts: ExtractedFact[];
  documentData: {
    filename: string;
    storagePath: string;
    fileSize: number;
    extractedText: string;
  };
}
function repairTruncatedJson(jsonText: string): any {
  try {
    return JSON.parse(jsonText);
  } catch (initialErr) {
    // Attempt graceful truncation repair
    let str = jsonText.trim();
    // Find the last complete object in facts array
    const lastObjectClose = str.lastIndexOf('}');
    if (lastObjectClose !== -1) {
      str = str.slice(0, lastObjectClose + 1).trim();
      // Remove trailing comma if present
      if (str.endsWith(',')) str = str.slice(0, -1).trim();
      // Close array and root object
      const openBrackets = (str.match(/\[/g) || []).length;
      const closeBrackets = (str.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) {
        str += ']';
      }
      const openBraces = (str.match(/\{/g) || []).length;
      const closeBraces = (str.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        str += '}';
      }
      try {
        return JSON.parse(str);
      } catch {
        // Fall through
      }
    }
    throw initialErr;
  }
}

function extractProductFallback(filename: string, text: string): ExtractionResult {
  const cleanName = filename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b(spec|specification|specs|datasheet|prd|manual|v\d+)\b/gi, '')
    .trim();
  const productName = cleanName || 'New Product';

  const facts: ExtractedFact[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const specPatterns = [
    { key: 'BATT', title: 'Battery Life', regex: /(?:battery(?:\s+life)?|playback|runtime|charge).*?(?:\d+\s*(?:hours?|hrs?|h|mah))/i },
    { key: 'DISP', title: 'Display', regex: /(?:display|screen).*?(?:\d+(?:\.\d+)?\s*(?:inch|inches|"|hz|oled|amoled|ips|pixels?|resolution))/i },
    { key: 'WEIGHT', title: 'Weight', regex: /(?:weight|weighs?).*?(?:\d+\s*(?:grams?|g|kg|lbs?|ounces?|oz))/i },
    { key: 'DIM', title: 'Dimensions', regex: /(?:dimensions?|size|thickness).*?(?:\d+.*?(?:mm|cm|inches?))/i },
    { key: 'PROC', title: 'Processor & Hardware', regex: /(?:processor|chipset|cpu|ram|memory|storage).*?(?:\d+\s*(?:gb|tb|ghz|core)|snapdragon|apple|intel|amd)/i },
    { key: 'WATER', title: 'Water Resistance', regex: /(?:water|dust|submersion|splash).*?(?:ip\d+|resistant|waterproof|meters?|atm)/i },
    { key: 'CONN', title: 'Connectivity', regex: /(?:connectivity|wireless|bluetooth|wi-?fi|5g|lte|cellular|usb-?c|nfc)/i },
    { key: 'WARR', title: 'Warranty', regex: /(?:warranty|guarantee).*?(?:\d+\s*(?:years?|months?))/i },
  ];

  let factIdx = 1;
  const usedKeys = new Set<string>();

  for (const { key, title, regex } of specPatterns) {
    for (const line of lines) {
      if (regex.test(line) && line.length > 15 && line.length < 350) {
        if (!usedKeys.has(key)) {
          usedKeys.add(key);
          facts.push({
            fact_code: `${key}-${String(factIdx++).padStart(3, '0')}`,
            title,
            fact_text: line,
            entity_name: productName,
            source_reference: 'Technical Specification',
            source_excerpt: line.slice(0, 200),
            verification_status: 'APPROVED',
            effective_from: new Date().toISOString().split('T')[0],
            expires_at: null,
            notes: 'Extracted from specification document',
          });
          break;
        }
      }
    }
  }

  if (facts.length < 3) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || lines;
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length > 25 && trimmed.length < 250 && /\d/.test(trimmed)) {
        facts.push({
          fact_code: `SPEC-${String(factIdx++).padStart(3, '0')}`,
          title: `Specification ${factIdx - 1}`,
          fact_text: trimmed,
          entity_name: productName,
          source_reference: 'Specification Sheet',
          source_excerpt: trimmed.slice(0, 200),
          verification_status: 'APPROVED',
          effective_from: new Date().toISOString().split('T')[0],
          expires_at: null,
          notes: 'Extracted from specification document',
        });
        if (facts.length >= 8) break;
      }
    }
  }

  return {
    product: {
      name: productName,
      category: 'Consumer Hardware',
      model_or_version: 'Standard',
      launch_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      description: `Product specifications and verified claims extracted from ${filename}.`,
    },
    facts,
    documentData: {
      filename,
      storagePath: '',
      fileSize: 0,
      extractedText: text.slice(0, 5000),
    },
  };
}

async function extractProductFromPDF(pdfText: string, filename: string): Promise<ExtractionResult> {
  const prompt = `You are a brand governance analyst. Extract structured product information and verifiable specifications from the product research/specification document below.

TASK: Parse the document and return:
1. Product metadata: name, category, model_or_version, launch_date (YYYY-MM-DD or null), description
2. Extract 10 to 15 key verifiable specifications and facts (e.g. processor, memory, storage, display, battery life, weight, dimensions, connectivity, camera, audio, warranty).

Rules for facts:
- Each fact must be atomic (one verifiable statement)
- Include specifications: battery life, weight, dimensions, materials, performance metrics, certifications, features
- Exclude marketing fluff, opinions, subjective claims
- Generate a unique fact_code for each (e.g., BATT-001, WEIGHT-002, MEM-003, DISP-004)
- Reference the source section/page where found

Document text excerpt:
${pdfText.slice(0, 20000)}

Return JSON only in this exact format:
{
  "product": {
    "name": "Product Name",
    "category": "Consumer Tech & Hardware",
    "model_or_version": "Model or Version",
    "launch_date": "2026-03-01",
    "status": "ACTIVE",
    "description": "Brief summary of the product"
  },
  "facts": [
    {
      "fact_code": "BATT-001",
      "title": "Battery Life",
      "fact_text": "Up to 18 hours of video playback or 15 hours of wireless web browsing.",
      "entity_name": "Product Name",
      "source_reference": "Section 3, Technical Specifications",
      "source_excerpt": "Up to 18h video / 15h web",
      "verification_status": "APPROVED",
      "effective_from": "2026-01-01",
      "expires_at": null,
      "notes": "Official vendor claim"
    }
  ]
}`;

  try {
    const response = await generateJson({ prompt, temperature: 0.1, maxTokens: 4000 });
    const jsonText = extractJsonBlock(response);
    const result = repairTruncatedJson(jsonText) as ExtractionResult;
    if (result && result.product && result.product.name) {
      return result;
    }
    return extractProductFallback(filename, pdfText);
  } catch (error) {
    console.warn('AI extraction failed or unavailable, using deterministic extractor:', error);
    return extractProductFallback(filename, pdfText);
  }
}

export const POST = withAdmin(async (ctx, req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) return fail('VALIDATION_ERROR', 'No file provided', 400);
    if (file.size > 15 * 1024 * 1024) return fail('VALIDATION_ERROR', 'File size exceeds maximum limit of 15MB', 400);
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) return fail('VALIDATION_ERROR', 'Please upload a PDF file', 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = join(UPLOAD_DIR, `knowledge-${Date.now()}-${sanitizedFilename}`);
    writeFileSync(storagePath, buffer);
    
    try {
      const extraction = await extractDocumentText(storagePath, 'application/pdf');
      const text = sanitizeExtractedText(extraction.text);
      
      const extractionResult = await extractProductFromPDF(text || file.name, file.name);
      
      // Create the product
      const createdProduct = await storage.createProduct({
        workspace_id: ctx.workspaceId,
        name: extractionResult.product.name,
        category: extractionResult.product.category || null,
        model_or_version: extractionResult.product.model_or_version || null,
        launch_date: extractionResult.product.launch_date || null,
        status: extractionResult.product.status || 'ACTIVE',
        description: extractionResult.product.description || null,
      });
      
      // Create the source document record
      const doc = await storage.createDocument({
        workspace_id: ctx.workspaceId,
        filename: file.name,
        storage_path: storagePath,
        mime_type: 'application/pdf',
        file_size: file.size,
        source_name: file.name,
        document_status: 'APPROVED',
        extracted_text: text,
        extraction_error: null,
        uploaded_by: ctx.userId,
      });
      const documentId = doc.id;
      
      // Create approved facts linked to the product
      const createdFacts = [];
      for (let i = 0; i < (extractionResult.facts || []).length; i++) {
        const fact = extractionResult.facts[i];
        const createdFact = await storage.createFact({
          workspace_id: ctx.workspaceId,
          product_id: createdProduct.id,
          fact_code: fact.fact_code || `FACT-${String(i + 1).padStart(3, '0')}`,
          title: fact.title,
          fact_text: fact.fact_text,
          entity_name: fact.entity_name || extractionResult.product.name,
          source_document_id: documentId,
          source_name: file.name,
          source_reference: fact.source_reference || null,
          source_excerpt: fact.source_excerpt || null,
          verification_status: 'APPROVED',
          effective_from: fact.effective_from || new Date().toISOString().split('T')[0],
          expires_at: fact.expires_at || null,
          notes: fact.notes || null,
          created_by: ctx.userId,
        });
        createdFacts.push(createdFact);
      }
      
      return ok({
        product: createdProduct,
        facts: createdFacts,
        documentId,
      });
    } catch (err) {
      try { unlinkSync(storagePath); } catch {}
      throw err;
    }
  } catch (err: any) {
    console.error('Knowledge product extraction error:', err);
    return fail('EXTRACTION_ERROR', err?.message ?? 'Failed to process document', 500);
  }
});