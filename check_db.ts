import { prisma } from './lib/db';

async function checkDB() {
  console.log('\n=== TOPICS IN DATABASE ===');
  const topics = await prisma.topic.findMany({
    include: { subTopics: true }
  });
  topics.forEach(t => {
    console.log(`\n📁 ${t.name} (ID: ${t.id})`);
    if (t.subTopics.length > 0) {
      t.subTopics.forEach(st => {
        console.log(`   └─ ${st.name} (ID: ${st.id})`);
      });
    }
  });

  console.log('\n=== RECENT NEWS STORIES ===');
  const stories = await prisma.newsStory.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { topic: true, subTopic: true }
  });
  stories.forEach(s => {
    console.log(`\n📰 ${s.title}`);
    console.log(`   Topic: ${s.topic?.name || 'NONE'}`);
    console.log(`   SubTopic: ${s.subTopic?.name || 'NONE'}`);
    console.log(`   Created: ${s.createdAt.toISOString()}`);
  });

  await prisma.$disconnect();
}

checkDB().catch(console.error);
