import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { getServerSession } from 'next-auth/next';

// POST - Upload media file
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: images and videos' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = file.name.split('.').pop();
    const filename = `${randomBytes(16).toString('hex')}.${extension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'media');

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filepath = join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Return public URL
    const publicUrl = `/uploads/media/${filename}`;

    return NextResponse.json(
      { 
        url: publicUrl,
        filename: filename,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
