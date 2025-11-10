import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listProfiles() {
  try {
    const profiles = await prisma.profile.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`Found ${profiles.length} profiles:\n`);

    for (const profile of profiles) {
      console.log(`Username: ${profile.username}`);
      console.log(`Email: ${profile.user.email}`);
      console.log(`Full Name: ${profile.fullName || 'N/A'}`);
      console.log(`---`);
    }
  } catch (error) {
    console.error('Error listing profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listProfiles();
