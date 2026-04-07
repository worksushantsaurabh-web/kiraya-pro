import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const firebaseUid = 'test-uid-' + Date.now();
    const email = 'test-' + Date.now() + '@google.com';
    const name = 'Test User';
    
    // Just try inserting exactly what the endpoint does
    let user = await prisma.user.create({
      data: {
        firebaseUid,
        email,
        name,
        role: 'LANDLORD',
        phone: null,
        imageUrl: null
      }
    });
    console.log("Created:", user);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
