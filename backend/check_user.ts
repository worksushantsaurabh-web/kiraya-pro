import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({ where: { role: 'CARETAKER' } });
  console.log('CARETAKERS IN DB:');
  users.forEach(u => {
    console.log(`ID: ${u.id}, NAME: ${u.name}, ROLE: ${u.role}, PHONE: ${u.phone}`);
  });
  process.exit(0);
}
check();
