const prisma = require('../prismaClient');

module.exports = async function (context, req) {
  context.log('Enrollments function triggered.');
  try {
    const { userId } = req.params || {};
    if (req.method === 'GET') {
      if (userId) {
        // Get enrollments for a specific user
        const enrollments = await prisma.enrollment.findMany({ where: { userId } });
        context.res = { status: 200, body: enrollments };
      } else {
        // Get all enrollments
        const enrollments = await prisma.enrollment.findMany();
        context.res = { status: 200, body: enrollments };
      }
    } else if (req.method === 'POST') {
      const { userId: bodyUserId, courseId } = req.body || {};
      if (!bodyUserId || !courseId) {
        context.res = { status: 400, body: 'userId and courseId are required' };
      } else {
        const newEnrollment = await prisma.enrollment.create({ data: { userId: bodyUserId, courseId: parseInt(courseId) } });
        context.res = { status: 201, body: newEnrollment };
      }
    } else {
      context.res = { status: 405, body: 'Method not allowed' };
    }
  } catch (error) {
    context.log.error('Error in Enrollments function:', error);
    context.res = { status: 500, body: 'Internal server error' };
  }
}; 