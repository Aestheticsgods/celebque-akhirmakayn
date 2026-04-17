import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const maintenanceFile = path.resolve(process.cwd(), 'maintenance.json');

// GET: Get current maintenance mode status
export async function GET() {
  try {
    const data = await fs.readFile(maintenanceFile, 'utf-8');
    const { maintenance } = JSON.parse(data);
    return NextResponse.json({ maintenance });
  } catch (e) {
    return NextResponse.json({ maintenance: false });
  }
}

// POST: Toggle maintenance mode (admin only, add auth in production)
export async function POST(request: Request) {
  const { maintenance } = await request.json();
  await fs.writeFile(maintenanceFile, JSON.stringify({ maintenance }, null, 2));
  return NextResponse.json({ maintenance });
}
