jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(({ messages }) => {
          return Promise.resolve({
            choices: [
              { message: { content: 'Mock quiz content' } }
            ]
          });
        })
      }
    }
  }));
});

const quizFn = require('../index');

describe('Quiz Function', () => {
  let context;

  beforeEach(() => {
    context = { log: jest.fn(), res: {} };
  });

  it('should return 400 if content is missing', async () => {
    const req = { body: {} };
    await quizFn(context, req);
    expect(context.res.status).toBe(400);
    expect(context.res.body).toBe('Missing "content" in request body');
  });

  it('should return 200 and quiz text when content is provided', async () => {
    const req = { body: { content: 'Some course content' } };
    await quizFn(context, req);
    expect(context.res.status).toBe(200);
    expect(context.res.body).toBe('Mock quiz content');
  });
}); 