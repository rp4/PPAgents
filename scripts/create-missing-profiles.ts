import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingProfiles() {
  try {
    // Find all users without profiles
    const usersWithoutProfiles = await prisma.user.findMany({
      where: {
        profile: null,
      },
    });

    console.log(`Found ${usersWithoutProfiles.length} users without profiles`);

    for (const user of usersWithoutProfiles) {
      if (!user.email) {
        console.log(`Skipping user ${user.id} - no email`);
        continue;
      }

      // Generate username from email
      const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      // Ensure unique username
      let username = baseUsername;
      let counter = 1;
      while (await prisma.profile.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Create profile
      await prisma.profile.create({
        data: {
          id: user.id,
          username,
          fullName: user.name || '',
          avatarUrl: user.image || '',
        },
      });

      console.log(`✓ Created profile for ${user.email} with username: ${username}`);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error creating profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingProfiles();
