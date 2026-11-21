import os from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

export function getUploadDir(): string {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );

  const baseDir = isServerless ? os.tmpdir() : process.cwd();
  const uploadDir = join(baseDir, '.brandvault', 'uploads');

  try {
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  } catch {
    // If writing to process.cwd() fails (e.g. read-only serverless filesystem), fallback to os.tmpdir()
    const tmpDir = join(os.tmpdir(), '.brandvault', 'uploads');
    try {
      if (!existsSync(tmpDir)) {
        mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}
    return tmpDir;
  }
}

export function safeWriteUpload(filename: string, buffer: Buffer): string {
  const dir = getUploadDir();
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetPath = join(dir, `${Date.now()}-${sanitized}`);
  try {
    writeFileSync(targetPath, buffer);
    return targetPath;
  } catch (err) {
    console.warn('[Storage] Could not write file to disk, using virtual path:', err);
    return targetPath;
  }
}
