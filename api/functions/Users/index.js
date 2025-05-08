const prisma = require('../prismaClient');

module.exports = async function (context, req) {
  context.log('Users function triggered.');
  try {
    const { id } = req.params || {};
    if (req.method === 'GET') {
      if (id) {
        // Get single user by id
        const user = await prisma.user.findUnique({
          where: { id },
          include: { enrollments: true }
        });
        if (!user) {
          context.res = { status: 404, body: 'User not found' };
        } else {
          context.res = { status: 200, body: user };
        }
      } else {
        // Get all users
        const users = await prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true }
        });
        context.res = { status: 200, body: users };
      }
    } else if (req.method === 'POST') {
      const { name, email, role } = req.body || {};
      if (!name || !email || !role) {
        context.res = { status: 400, body: 'name, email, and role are required' };
      } else {
        try {
          const newUser = await prisma.user.create({
            data: { name, email, role }
          });
          context.res = { status: 201, body: newUser };
        } catch (err) {
          if (err.code === 'P2002') {
            context.res = { status: 400, body: 'Email must be unique' };
          } else {
            throw err;
          }
        }
      }
    } else {
      context.res = { status: 405, body: 'Method not allowed' };
    }
  } catch (error) {
    context.log.error('Error in Users function:', error);
    context.res = { status: 500, body: 'Internal server error' };
  }
}; 