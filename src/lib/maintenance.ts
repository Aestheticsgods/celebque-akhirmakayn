import { prisma } from './prisma';

const MAINTENANCE_KEY = 'maintenance_mode';

export async function getMaintenanceMode(): Promise<boolean> {
  const setting = await prisma.setting.findUnique({ where: { key: MAINTENANCE_KEY } });
  return setting ? setting.value === 'true' : false;
}

export async function setMaintenanceMode(value: boolean): Promise<void> {
  await prisma.setting.upsert({
    where: { key: MAINTENANCE_KEY },
    update: { value: value ? 'true' : 'false' },
    create: { key: MAINTENANCE_KEY, value: value ? 'true' : 'false' },
  });
}
