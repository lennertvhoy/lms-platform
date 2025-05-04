const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
  endpoint: process.env.OPENAI_ENDPOINT
});

module.exports = async function (context, req) {
  context.log('Quiz function triggered.');
  const { content } = req.body || {};
  if (!content) {
    context.res = { status: 400, body: 'Missing "content" in request body' };
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an educational content assistant.' },
        { role: 'user', content: `Given the following course content, create 5 multiple-choice questions.\n\n${content}` }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const quizText = response.choices[0].message.content;
    context.res = { status: 200, body: quizText };
  } catch (err) {
    context.log.error('Error in Quiz function:', err);
    context.res = { status: 500, body: 'Quiz generation failed.' };
  }
}; 