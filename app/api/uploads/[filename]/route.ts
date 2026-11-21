import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUploadDir } from '@/lib/fs-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Sanitize filename against directory traversal
  const safeFilename = path.basename(filename);
  
  // Search in uploads, approved_assets, and test_assets
  const searchDirs = [
    getUploadDir(),
    path.join(process.cwd(), '.brandvault', 'uploads'),
    path.join(process.cwd(), '.brandvault', 'approved_assets'),
    path.join(process.cwd(), '.brandvault', 'test_assets'),
  ];

  let targetPath: string | null = null;
  for (const dir of searchDirs) {
    const candidate = path.join(dir, safeFilename);
    if (fs.existsSync(candidate)) {
      targetPath = candidate;
      break;
    }
  }

  if (!targetPath) {
    return new NextResponse('File not found', { status: 404 });
  }

  const ext = path.extname(safeFilename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const fileBuffer = fs.readFileSync(targetPath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  });
}
