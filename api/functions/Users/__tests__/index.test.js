jest.mock('../../prismaClient', () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn()
  }
}));

const prisma = require('../../prismaClient');
const usersFn = require('../index');

describe('Users Function', () => {
  afterEach(() => jest.clearAllMocks());

  it('GET should return all users', async () => {
    const mockUsers = [
      { id: 'u1', name: 'Alice', email: 'a@example.com', role: 'student' }
    ];
    prisma.user.findMany.mockResolvedValue(mockUsers);

    const context = { log: jest.fn(), res: {} };
    const req = { method: 'GET', params: {} };

    await usersFn(context, req);

    expect(prisma.user.findMany).toHaveBeenCalledWith({ select: { id: true, name: true, email: true, role: true } });
    expect(context.res.status).toBe(200);
    expect(context.res.body).toEqual(mockUsers);
  });

  it('POST should create a new user', async () => {
    const input = { name: 'Bob', email: 'b@example.com', role: 'instructor' };
    const mockUser = { id: 'u2', ...input };
    prisma.user.create.mockResolvedValue(mockUser);

    const context = { log: jest.fn(), res: {} };
    const req = { method: 'POST', params: {}, body: input };

    await usersFn(context, req);

    expect(prisma.user.create).toHaveBeenCalledWith({ data: input });
    expect(context.res.status).toBe(201);
    expect(context.res.body).toEqual(mockUser);
  });
}); 