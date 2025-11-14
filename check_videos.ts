import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allVideos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      script: {
        include: {
          newsStory: true
        }
      }
    }
  });
  
  console.log(`\n=== All ${allVideos.length} Videos ===`);
  allVideos.forEach(video => {
    const title = video.script.newsStory.title;
    if (title.toLowerCase().includes('ukraine') || title.toLowerCase().includes('war')) {
      console.log(`\n✓ UKRAINE VIDEO FOUND!`);
      console.log(`Title: ${title}`);
      console.log(`Status: ${video.status}`);
      console.log(`File: ${video.filePath || 'N/A'}`);
    }
  });
  
  // Also list all titles
  console.log(`\n=== All Video Titles ===`);
  const uniqueTitles = [...new Set(allVideos.map(v => v.script.newsStory.title))];
  uniqueTitles.forEach((title, i) => console.log(`${i+1}. ${title}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
