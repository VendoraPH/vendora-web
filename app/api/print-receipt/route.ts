import { NextRequest, NextResponse } from 'next/server';
import { formatReceipt, type ReceiptPrintData } from '@/lib/esc-pos';
import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

// Force Node.js runtime (not Edge) so we can use child_process and fs
export const runtime = 'nodejs';

// Printer name as configured in CUPS (run `lpstat -p` to check)
const PRINTER_NAME = process.env.THERMAL_PRINTER_NAME || 'POS58';

export async function POST(req: NextRequest) {
  try {
    const data: ReceiptPrintData = await req.json();
    const raw = formatReceipt(data);

    // Write ESC/POS data to a temp file, then send to printer via lp
    const tmpFile = join(tmpdir(), `receipt-${Date.now()}.bin`);
    await writeFile(tmpFile, raw, 'binary');

    await new Promise<void>((resolve, reject) => {
      exec(
        `lp -d ${PRINTER_NAME} -o raw "${tmpFile}"`,
        (error, _stdout, stderr) => {
          // Clean up temp file regardless of outcome
          unlink(tmpFile).catch(() => {});

          if (error) {
            reject(new Error(stderr || error.message));
          } else {
            resolve();
          }
        }
      );
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Print error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Print failed' },
      { status: 500 }
    );
  }
}
