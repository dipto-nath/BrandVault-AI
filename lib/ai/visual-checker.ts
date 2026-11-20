import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface VisualCheckEvidence {
  assetId?: string;
  matchedVersion?: string;
  expectedVersion?: string;
  validityInterval?: string;
  goodMatches?: number;
  inlierMatches?: number;
  referenceImageKey?: string;
  ratio?: number;
  required?: number;
  foreground?: string;
  background?: string;
  altAttributePresent?: boolean;
  standard?: string;
  [key: string]: any;
}

export interface VisualFinding {
  type: 'ASSET_MISMATCH' | 'LOW_CONTRAST' | 'MISSING_ALT_TEXT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  ruleId: string;
  title: string;
  message: string;
  originalPhrase: string;
  suggestedCorrection: string;
  confidence: number;
  evidence: VisualCheckEvidence;
}

export interface VisualAnalysisResult {
  status: 'complete' | 'failed';
  image: {
    filename: string;
    mimeType: string;
    byteSize: number;
    width: number;
    height: number;
    format: string | null;
    contrast: {
      ratio: number;
      foreground: string;
      background: string;
      passesAA: boolean;
    };
    altText: {
      provided: string | null;
      isDecorative: boolean;
      compliant: boolean;
    };
  };
  findings: VisualFinding[];
  metrics: {
    totalChecks: number;
    findingsCount: number;
    assetCheck: 'mismatch' | 'pass';
    contrastCheck: 'fail' | 'pass';
    altTextCheck: 'fail' | 'pass';
  };
}

export interface VisualCheckOptions {
  imagePath: string;
  altText?: string | null;
  isDecorative?: boolean;
  channel?: string;
  foregroundColor?: string | null;
  backgroundColor?: string | null;
  isLargeText?: boolean;
}

export async function runVisualCheck(options: VisualCheckOptions): Promise<VisualAnalysisResult> {
  const pythonPath = '/Library/Frameworks/Python.framework/Versions/3.14/bin/python3';
  const scriptPath = path.join(process.cwd(), 'lib', 'ai', 'visual-checker.py');
  const approvedDir = path.join(process.cwd(), '.brandvault', 'approved_assets');

  const args = [
    scriptPath,
    '--image', options.imagePath,
    '--channel', options.channel || 'WEBSITE',
    '--approved-dir', approvedDir,
  ];

  if (options.altText) {
    args.push('--alt', options.altText);
  }
  if (options.isDecorative) {
    args.push('--decorative');
  }
  if (options.foregroundColor) {
    args.push('--fg', options.foregroundColor);
  }
  if (options.backgroundColor) {
    args.push('--bg', options.backgroundColor);
  }
  if (options.isLargeText) {
    args.push('--large-text');
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('Visual checker script error (exit ' + code + '):', stderr);
        return reject(new Error(stderr || `Visual checker failed with exit code ${code}`));
      }
      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result as VisualAnalysisResult);
      } catch (err: any) {
        reject(new Error(`Failed to parse visual checker output: ${err.message}. Raw output: ${stdout}`));
      }
    });
  });
}
