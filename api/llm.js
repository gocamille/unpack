const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const { SYSTEM_PROMPT, getUserPrompt } = require('./prompt');

// Initialize clients
// Note: It's okay if keys are missing if that specific provider isn't used
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generates a simplified version of the text using the specified provider.
 * @param {string} text - The text to simplify.
 * @param {string} [provider='anthropic'] - 'gemini' or 'anthropic'
 * @returns {Promise<string>} - The simplified text.
 */
async function generateSimplification(text, provider = 'anthropic') {
  if (provider === 'gemini') {
    return generateWithGemini(text);
  } else {
    // Default to Anthropic
    return generateWithAnthropic(text);
  }
}

async function generateWithAnthropic(text) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Using the model user had in index.js
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: getUserPrompt(text)
        }
      ],
      system: SYSTEM_PROMPT
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Anthropic API error:', error);
    throw error;
  }
}

async function generateWithGemini(text) {
  try {
    // defaults to gemini-3.0-pro as requested, but allows override
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.0-pro';
    const model = genAI.getGenerativeModel({ model: modelName });

    const chat = model.startChat({
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await chat.sendMessage(getUserPrompt(text));
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

module.exports = { generateSimplification };
