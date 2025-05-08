const hello = require('../index');

describe('Hello Function', () => {
  it('should return status 200 and greeting message', async () => {
    const context = { log: jest.fn(), res: {} };
    const req = {};

    await hello(context, req);

    expect(context.res.status).toBe(200);
    expect(context.res.body).toBe('Hello from Azure Functions!');
  });
}); 