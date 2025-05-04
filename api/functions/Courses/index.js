const prisma = require('../prismaClient');

module.exports = async function (context, req) {
  context.log('Courses function triggered.');
  try {
    const { id } = req.params || {};
    if (req.method === 'GET') {
      if (id) {
        // Get single course with modules
        const course = await prisma.course.findUnique({
          where: { id: parseInt(id) },
          include: { modules: true }
        });
        if (!course) {
          context.res = { status: 404, body: 'Course not found' };
        } else {
          context.res = { status: 200, body: course };
        }
      } else {
        // Get all courses
        const courses = await prisma.course.findMany({
          select: { id: true, title: true, isPublished: true }
        });
        context.res = { status: 200, body: courses };
      }
    } else if (req.method === 'POST') {
      const { title, description } = req.body;
      if (!title) {
        context.res = { status: 400, body: 'Title is required' };
      } else {
        const newCourse = await prisma.course.create({
          data: { title, description },
        });
        context.res = { status: 201, body: newCourse };
      }
    } else {
      context.res = { status: 405, body: 'Method not allowed' };
    }
  } catch (error) {
    context.log.error('Error in Courses function:', error);
    context.res = { status: 500, body: 'Internal server error' };
  }
}; 