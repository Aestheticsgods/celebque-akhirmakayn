import { NextResponse } from 'next/server';
import { getMaintenanceMode, setMaintenanceMode } from '@/lib/maintenance';

// GET: Get current maintenance mode status
export async function GET() {
  const maintenance = await getMaintenanceMode();
  return NextResponse.json({ maintenance });
}

// POST: Toggle maintenance mode (admin only, add auth in production)
export async function POST(request: Request) {
  const { maintenance } = await request.json();
  await setMaintenanceMode(maintenance);
  return NextResponse.json({ maintenance });
}
