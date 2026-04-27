import { NextRequest, NextResponse } from 'next/server';
import { access, readFile, stat } from 'fs/promises';
import { createReadStream } from 'fs';
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
  req: NextRequest,
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

    const fileStat = await stat(filePath);
    const fileSize = fileStat.size;
    const range = req.headers.get('range');
    const mimeType = getMimeType(filename);

    if (range) {
      // Parse Range header, e.g. "bytes=0-1023"
      const match = range.match(/bytes=(\d*)-(\d*)/);
      if (!match) {
        return new NextResponse(null, { status: 416 });
      }
      let start = parseInt(match[1], 10);
      let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      if (isNaN(start)) start = 0;
      if (isNaN(end) || end >= fileSize) end = fileSize - 1;
      if (start > end || start >= fileSize) {
        return new NextResponse(null, { status: 416 });
      }

      const chunkSize = end - start + 1;
      const stream = createReadStream(filePath, { start, end });
      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
      };
      // @ts-ignore
      return new NextResponse(stream as any, {
        status: 206,
        headers,
      });
    } else {
      const fileBuffer = await readFile(filePath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': fileSize.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Range',
        },
      });
    }
  } catch (error) {
    console.error('Error serving media file:', error);
    return NextResponse.json({ error: 'Failed to serve media file' }, { status: 500 });
  }
}
