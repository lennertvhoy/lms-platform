const prisma = require('../prismaClient');

module.exports = async function (context, req) {
  context.log('Modules function triggered.');
  try {
    const { id } = req.params || {};
    if (req.method === 'GET') {
      if (id) {
        // Get single module by id
        const moduleItem = await prisma.module.findUnique({ where: { id: parseInt(id) } });
        if (!moduleItem) {
          context.res = { status: 404, body: 'Module not found' };
        } else {
          context.res = { status: 200, body: moduleItem };
        }
      } else {
        // Get modules, optionally filter by courseId
        const { courseId } = req.query || {};
        const filter = courseId ? { where: { courseId: parseInt(courseId) } } : {};
        const modules = await prisma.module.findMany(filter);
        context.res = { status: 200, body: modules };
      }
    } else if (req.method === 'POST') {
      const { courseId, title, content, orderIndex } = req.body || {};
      if (!courseId || !title) {
        context.res = { status: 400, body: 'courseId and title are required' };
      } else {
        const newModule = await prisma.module.create({
          data: { courseId: parseInt(courseId), title, content, orderIndex: orderIndex || 0 }
        });
        context.res = { status: 201, body: newModule };
      }
    } else if (req.method === 'PUT') {
      if (!id) {
        context.res = { status: 400, body: 'Module id is required for update' };
      } else {
        const { courseId, title, content, orderIndex } = req.body || {};
        const data = {};
        if (courseId !== undefined) data.courseId = parseInt(courseId);
        if (title !== undefined) data.title = title;
        if (content !== undefined) data.content = content;
        if (orderIndex !== undefined) data.orderIndex = orderIndex;
        const updatedModule = await prisma.module.update({
          where: { id: parseInt(id) },
          data
        });
        context.res = { status: 200, body: updatedModule };
      }
    } else if (req.method === 'DELETE') {
      if (!id) {
        context.res = { status: 400, body: 'Module id is required for deletion' };
      } else {
        await prisma.module.delete({ where: { id: parseInt(id) } });
        context.res = { status: 204 };
      }
    } else {
      context.res = { status: 405, body: 'Method not allowed' };
    }
  } catch (error) {
    context.log.error('Error in Modules function:', error);
    context.res = { status: 500, body: 'Internal server error' };
  }
}; 