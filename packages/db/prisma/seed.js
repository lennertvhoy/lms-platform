const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Running seed script...');
  // Clean up existing data
  await prisma.progress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // Create sample courses with modules
  const course1 = await prisma.course.create({
    data: {
      title: 'Introduction to Azure',
      description: 'Learn the fundamentals of Microsoft Azure cloud.',
      isPublished: true,
      modules: {
        create: [
          { title: 'Azure Basics', content: 'Overview of Azure core services.' },
          { title: 'Resource Management', content: 'Managing resources with ARM.' }
        ]
      }
    },
    include: { modules: true }
  });
  console.log('Created course:', course1);

  const course2 = await prisma.course.create({
    data: {
      title: 'Node.js Development',
      description: 'Build backend apps using Node.js.',
      isPublished: false,
      modules: {
        create: [
          { title: 'JS Fundamentals', content: 'Basic JavaScript concepts.' },
          { title: 'Express Framework', content: 'Building APIs with Express.' }
        ]
      }
    },
    include: { modules: true }
  });
  console.log('Created course:', course2);

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 