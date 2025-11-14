
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create base topics with sub-topics
  const topics = [
    {
      name: 'RVing',
      description: 'Recreational vehicle lifestyle, travel, and industry news',
      subTopics: [
        { name: 'RV Travel', description: 'Destinations and travel experiences' },
        { name: 'RV Maintenance', description: 'Maintenance, repairs, and upgrades' },
        { name: 'RV Industry', description: 'Industry trends and new products' },
        { name: 'RV Living', description: 'Full-time RV living and lifestyle' },
      ],
    },
    {
      name: 'Outdoors',
      description: 'Outdoor activities, nature, and adventure news',
      subTopics: [
        { name: 'Camping', description: 'Camping trips, gear, and locations' },
        { name: 'Hiking', description: 'Hiking trails, tips, and adventures' },
        { name: 'Wildlife', description: 'Wildlife conservation and encounters' },
        { name: 'National Parks', description: 'National park news and updates' },
        { name: 'Adventure Sports', description: 'Extreme and adventure sports' },
      ],
    },
    {
      name: 'US Government',
      description: 'Federal, state, and local government news and policies',
      subTopics: [
        { name: 'Federal Politics', description: 'Federal government and politics' },
        { name: 'State Government', description: 'State-level government news' },
        { name: 'Local Government', description: 'City and county government' },
        { name: 'Policy Changes', description: 'New policies and regulations' },
        { name: 'Elections', description: 'Election news and candidate updates' },
      ],
    },
    {
      name: 'High-Tech',
      description: 'Technology industry news and breakthroughs',
      subTopics: [
        { name: 'AI', description: 'Artificial intelligence developments' },
        { name: 'Quantum Computing', description: 'Quantum computing research and news' },
        { name: 'Coding', description: 'Programming languages and development' },
        { name: 'Space', description: 'Space technology and exploration' },
        { name: 'Tech Breakthroughs', description: 'Major technological innovations' },
      ],
    },
  ];

  console.log('Creating topics and sub-topics...');

  for (const topicData of topics) {
    const { subTopics, ...topicInfo } = topicData;
    
    const topic = await prisma.topic.upsert({
      where: { name: topicInfo.name },
      update: topicInfo,
      create: {
        ...topicInfo,
        subTopics: {
          create: subTopics,
        },
      },
      include: {
        subTopics: true,
      },
    });

    console.log(`✅ Created topic: ${topic.name} with ${topic.subTopics.length} sub-topics`);
  }

  // Create default user preferences
  const preferences = await prisma.userPreferences.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      defaultDuration: 60,
      defaultVoiceType: 'female',
      includeImages: true,
    },
  });

  console.log('✅ Created default user preferences');

  // Create some sample news stories for testing (optional)
  const sampleStories = [
    {
      topicName: 'High-Tech',
      subTopicName: 'AI',
      stories: [
        {
          title: 'Major AI Breakthrough in Natural Language Processing',
          summary: 'Researchers announce significant improvements in AI language models, enabling more human-like conversations.',
          content: 'In a groundbreaking development, researchers at leading technology institutions have unveiled major improvements in natural language processing AI models. The new technology demonstrates unprecedented ability to understand context, nuance, and emotional undertones in human communication. This breakthrough could revolutionize how we interact with digital assistants, customer service systems, and educational tools. The implications for businesses and consumers are vast, potentially making AI interactions indistinguishable from human conversations.',
          ranking: 1,
        },
      ],
    },
    {
      topicName: 'Outdoors',
      subTopicName: 'National Parks',
      stories: [
        {
          title: 'New National Park Designation Protects Critical Wildlife Habitat',
          summary: 'Congress approves new national park status for pristine wilderness area, ensuring protection for endangered species.',
          content: 'Congress has officially designated a new national park, protecting over 500,000 acres of critical wildlife habitat. The newly protected area serves as home to several endangered species and contains pristine wilderness that has remained largely untouched by human development. Environmental groups celebrate this victory as a crucial step in conservation efforts. The park is expected to open to visitors next year, with carefully managed trails and facilities designed to minimize environmental impact while providing educational opportunities.',
          ranking: 2,
        },
      ],
    },
  ];

  console.log('Creating sample news stories...');

  for (const sampleGroup of sampleStories) {
    const topic = await prisma.topic.findUnique({
      where: { name: sampleGroup.topicName },
      include: { subTopics: true },
    });

    if (topic) {
      const subTopic = topic.subTopics.find(st => st.name === sampleGroup.subTopicName);
      
      for (const storyData of sampleGroup.stories) {
        await prisma.newsStory.upsert({
          where: { 
            id: `sample-${sampleGroup.topicName}-${sampleGroup.subTopicName}-${storyData.ranking}`,
          },
          update: storyData,
          create: {
            id: `sample-${sampleGroup.topicName}-${sampleGroup.subTopicName}-${storyData.ranking}`,
            ...storyData,
            topicId: topic.id,
            subTopicId: subTopic?.id,
            publishedAt: new Date(),
          },
        });
      }
    }
  }

  console.log('✅ Created sample news stories');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
