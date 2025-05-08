jest.mock('../../prismaClient', () => ({
  module: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

const prisma = require('../../prismaClient');
const modulesFn = require('../index');

describe('Modules Function', () => {
  afterEach(() => jest.clearAllMocks());

  it('GET should return all modules when no id', async () => {
    const mockModules = [
      { id: 1, courseId: 1, title: 'Mod1', content: null, orderIndex: 0 }
    ];
    prisma.module.findMany.mockResolvedValue(mockModules);

    const context = { log: jest.fn(), res: {} };
    const req = { method: 'GET', params: {} };

    await modulesFn(context, req);

    expect(prisma.module.findMany).toHaveBeenCalledWith({});
    expect(context.res.status).toBe(200);
    expect(context.res.body).toEqual(mockModules);
  });

  it('GET with id should return single module', async () => {
    const mockModule = { id: 1, courseId: 1, title: 'Mod1', content: 'text', orderIndex: 0 };
    prisma.module.findUnique.mockResolvedValue(mockModule);

    const context = { log: jest.fn(), res: {} };
    const req = { method: 'GET', params: { id: '1' }, query: {} };

    await modulesFn(context, req);

    expect(prisma.module.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(context.res.status).toBe(200);
    expect(context.res.body).toEqual(mockModule);
  });
}); 