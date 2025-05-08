const prisma = require('../prismaClient');

module.exports = async function (context, req) {
  context.log('Progress function triggered.');
  try {
    const { userId } = req.params || {};
    const { moduleId } = req.query || {};

    if (req.method === 'GET') {
      if (userId && moduleId) {
        // Get specific progress entry
        const prog = await prisma.progress.findFirst({ where: { userId, moduleId: parseInt(moduleId) } });
        if (!prog) {
          context.res = { status: 404, body: 'Progress not found' };
        } else {
          context.res = { status: 200, body: prog };
        }
      } else if (userId) {
        // Get all progress for a user
        const progs = await prisma.progress.findMany({ where: { userId } });
        context.res = { status: 200, body: progs };
      } else {
        // Get all progress entries
        const progs = await prisma.progress.findMany();
        context.res = { status: 200, body: progs };
      }

    } else if (req.method === 'POST') {
      const { userId: bodyUserId, moduleId: bodyModuleId, status, score } = req.body || {};
      if (!bodyUserId || !bodyModuleId || !status) {
        context.res = { status: 400, body: 'userId, moduleId, and status are required' };
      } else {
        // Check if progress exists
        const existing = await prisma.progress.findFirst({ where: { userId: bodyUserId, moduleId: parseInt(bodyModuleId) } });
        if (existing) {
          // Update existing entry
          const updated = await prisma.progress.update({
            where: { userId_moduleId: { userId: bodyUserId, moduleId: parseInt(bodyModuleId) } },
            data: { status, score: score !== undefined ? score : existing.score }
          });
          context.res = { status: 200, body: updated };
        } else {
          // Create new entry
          const created = await prisma.progress.create({
            data: { userId: bodyUserId, moduleId: parseInt(bodyModuleId), status, score }
          });
          context.res = { status: 201, body: created };
        }
      }

    } else {
      context.res = { status: 405, body: 'Method not allowed' };
    }
  } catch (error) {
    context.log.error('Error in Progress function:', error);
    context.res = { status: 500, body: 'Internal server error' };
  }
}; 