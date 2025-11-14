
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearStuckTasks() {
  try {
    // Find all videos in PROCESSING state
    const stuckVideos = await prisma.video.findMany({
      where: {
        status: 'PROCESSING'
      }
    });

    console.log(`Found ${stuckVideos.length} stuck video(s)`);

    if (stuckVideos.length > 0) {
      // Update all stuck videos to ERROR state
      const result = await prisma.video.updateMany({
        where: {
          status: 'PROCESSING'
        },
        data: {
          status: 'ERROR',
          errorMessage: 'Task was interrupted or timed out'
        }
      });

      console.log(`✓ Cleared ${result.count} stuck video task(s)`);
      
      // List the cleared videos
      for (const video of stuckVideos) {
        console.log(`  - Video ID: ${video.id}, Title: ${video.title}`);
      }
    } else {
      console.log('✓ No stuck tasks found');
    }

  } catch (error) {
    console.error('Error clearing stuck tasks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearStuckTasks();
