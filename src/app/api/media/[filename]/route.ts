import { NextRequest, NextResponse } from 'next/server';
import { access, readFile } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

function getMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  const extension = Object.keys(MIME_TYPES).find((ext) => lower.endsWith(ext));
  return extension ? MIME_TYPES[extension] : 'application/octet-stream';
}

function getUploadDir(): string {
  return process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads', 'media');
}

async function findFilePath(filename: string): Promise<string | null> {
  const candidates = [
    join(getUploadDir(), filename),
    join(process.cwd(), 'uploads', 'media', filename),
    join(process.cwd(), 'public', 'uploads', 'media', filename),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate, constants.F_OK | constants.R_OK);
      return candidate;
    } catch {
      // Continue checking other candidate paths.
    }
  }

  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = await findFilePath(filename);
    if (!filePath) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': getMimeType(filename),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
      },
    });
  } catch (error) {
    console.error('Error serving media file:', error);
    return NextResponse.json({ error: 'Failed to serve media file' }, { status: 500 });
  }
}
