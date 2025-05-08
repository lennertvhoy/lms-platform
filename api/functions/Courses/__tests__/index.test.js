jest.mock('../../prismaClient', () => ({
  course: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

const prisma = require('../../prismaClient');
const coursesFn = require('../index');

describe('Courses Function', () => {
  afterEach(() => jest.clearAllMocks());

  it('GET should return all courses', async () => {
    const mockCourses = [
      { id: 1, title: 'Course 1', isPublished: true },
      { id: 2, title: 'Course 2', isPublished: false }
    ];
    prisma.course.findMany.mockResolvedValue(mockCourses);

    const context = { log: jest.fn(), res: {} };
    const req = { method: 'GET', params: {} };

    await coursesFn(context, req);

    expect(prisma.course.findMany).toHaveBeenCalledWith({ select: { id: true, title: true, isPublished: true } });
    expect(context.res.status).toBe(200);
    expect(context.res.body).toEqual(mockCourses);
  });

  it('GET with id should return single course', async () => {
    const mockCourse = { id: 1, title: 'Single Course', modules: [] };
    prisma.course.findUnique.mockResolvedValue(mockCourse);

    const context = { log: jest.fn(), res: {} };
    const req = { method: 'GET', params: { id: '1' } };

    await coursesFn(context, req);

    expect(prisma.course.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { modules: true }
    });
    expect(context.res.status).toBe(200);
    expect(context.res.body).toEqual(mockCourse);
  });

  it('PUT should update a course', async () => {
    const mockUpdated = { id: 1, title: 'Updated', description: 'Desc', isPublished: true };
    prisma.course.update.mockResolvedValue(mockUpdated);

    const context = { log: jest.fn(), res: {} };
    const req = {
      method: 'PUT',
      params: { id: '1' },
      body: { title: 'Updated', description: 'Desc', isPublished: true }
    };

    await coursesFn(context, req);

    expect(prisma.course.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { title: 'Updated', description: 'Desc', isPublished: true }
    });
    expect(context.res.status).toBe(200);
    expect(context.res.body).toEqual(mockUpdated);
  });

  it('DELETE should remove a course', async () => {
    prisma.course.delete.mockResolvedValue();

    const context = { log: jest.fn(), res: {} };
    const req = {
      method: 'DELETE',
      params: { id: '1' }
    };

    await coursesFn(context, req);

    expect(prisma.course.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(context.res.status).toBe(204);
  });
}); 