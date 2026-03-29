import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany({ where: { role: 'CARETAKER' } });
    console.log('CARETAKERS IN DB:');
    
    if (users.length === 0) {
      console.log('No caretakers found.');
    } else {
      users.forEach(u => {
        console.log(`ID: ${u.id}, NAME: ${u.name}, ROLE: ${u.role}, PHONE: ${u.phone}`);
      });
    }
  } catch (error) {
    console.error('Error fetching caretakers:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

check();
