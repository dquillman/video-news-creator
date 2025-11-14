import { prisma } from './lib/db';

async function checkQuantum() {
  // Get Quantum Computing subtopic
  const quantum = await prisma.subTopic.findFirst({
    where: { name: { contains: 'Quantum', mode: 'insensitive' } },
    include: { topic: true }
  });

  console.log('\n=== QUANTUM COMPUTING SUBTOPIC ===');
  console.log(quantum);

  if (quantum) {
    // Get all stories for Quantum Computing
    const stories = await prisma.newsStory.findMany({
      where: { subTopicId: quantum.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n=== QUANTUM COMPUTING STORIES ===');
    console.log(`Found ${stories.length} stories`);
    stories.forEach(s => {
      console.log(`\n📰 ${s.title}`);
      console.log(`   ID: ${s.id}`);
      console.log(`   Created: ${s.createdAt}`);
    });

    // Get videos using these stories
    const videos = await prisma.video.findMany({
      where: {
        script: {
          newsStoryId: { in: stories.map(s => s.id) }
        }
      },
      include: {
        script: {
          include: {
            newsStory: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 15
    });

    console.log('\n=== QUANTUM COMPUTING VIDEOS ===');
    console.log(`Found ${videos.length} videos`);
    videos.forEach(v => {
      console.log(`\n🎬 ${v.script?.newsStory?.title || 'Unknown'}`);
      console.log(`   Video ID: ${v.id}`);
      console.log(`   Status: ${v.status}`);
      console.log(`   Created: ${v.createdAt}`);
    });
  }

  await prisma.$disconnect();
}

checkQuantum();
