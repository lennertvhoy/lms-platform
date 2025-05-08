jest.mock('../../prismaClient', () => ({
  enrollment: {
    findMany: jest.fn(),
    create: jest.fn()
  }
}));

const prisma = require('../../prismaClient');
const enrollmentsFn = require('../index');

describe('Enrollments Function', () => {
  afterEach(() => jest.clearAllMocks());

  it('GET should return all enrollments when no userId', async () => {
    const mockEnrollments = [
      { userId: 'u1', courseId: 1, enrolledAt: '2025-01-01T00:00:00Z' }
    ];
    prisma.enrollment.findMany.mockResolvedValue(mockEnrollments);

    const context = { log: jest.fn(), res: {} };
    const req = { method: 'GET', params: {} };

    await enrollmentsFn(context, req);

    expect(prisma.enrollment.findMany).toHaveBeenCalledWith();
    expect(context.res.status).toBe(200);
    expect(context.res.body).toEqual(mockEnrollments);
  });

  it('GET by userId should return user enrollments', async () => {
    const mockEnrollments = [
      { userId: 'u2', courseId: 2, enrolledAt: '2025-01-02T00:00:00Z' }
    ];
    prisma.enrollment.findMany.mockResolvedValue(mockEnrollments);

    const context = { log: jest.fn(), res: {} };
    const req = { method: 'GET', params: { userId: 'u2' } };

    await enrollmentsFn(context, req);

    expect(prisma.enrollment.findMany).toHaveBeenCalledWith({ where: { userId: 'u2' } });
    expect(context.res.status).toBe(200);
    expect(context.res.body).toEqual(mockEnrollments);
  });

  it('POST should create a new enrollment', async () => {
    const input = { userId: 'u3', courseId: 3 };
    const mockEnrollment = { ...input, enrolledAt: '2025-01-03T00:00:00Z' };
    prisma.enrollment.create.mockResolvedValue(mockEnrollment);

    const context = { log: jest.fn(), res: {} };
    const req = { method: 'POST', params: {}, body: input };

    await enrollmentsFn(context, req);

    expect(prisma.enrollment.create).toHaveBeenCalledWith({ data: { userId: 'u3', courseId: 3 } });
    expect(context.res.status).toBe(201);
    expect(context.res.body).toEqual(mockEnrollment);
  });
}); 