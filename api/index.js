const express = require('express');
const cors = require('cors');
const { generateSimplification } = require('./llm');

const app = express();
// const anthropic = new Anthropic(); // Moved to llm.js

// Simple in-memory rate limiting (good enough for hackathon)
const requestCounts = new Map();
const RATE_LIMIT = 30; // requests per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return next();
  }

  const record = requestCounts.get(ip);

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_WINDOW;
    return next();
  }

  if (record.count >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  record.count++;
  next();
}

// Middleware
app.use(cors({
  origin: '*', // For hackathon; tighten in production
  methods: ['POST']
}));
app.use(express.json({ limit: '50kb' })); // Limit payload size
app.use(rateLimit);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'unpack-api' });
});

// Main simplification endpoint
app.post('/simplify', async (req, res) => {
  const { text } = req.body;

  // Validation
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "text" field' });
  }

  const trimmedText = text.trim();

  if (trimmedText.length < 10) {
    return res.status(400).json({ error: 'Text too short to simplify' });
  }

  if (trimmedText.length > 10000) {
    return res.status(400).json({ error: 'Text too long. Please select less than 10,000 characters.' });
  }

  try {
    // Determine provider: use LLM_PROVIDER env var, default to 'anthropic' if not set
    const provider = process.env.LLM_PROVIDER || 'anthropic';

    console.log(`Simplifying with provider: ${provider}`);

    const simplified = await generateSimplification(trimmedText, provider);

    res.json({
      simplified,
      originalLength: trimmedText.length,
      simplifiedLength: simplified.length,
      provider // Returning provider for debugging/transparency
    });

  } catch (error) {
    console.error('Simplification error:', error);

    // Basic error categorization
    if (error.status === 429) {
      return res.status(503).json({ error: 'Service busy. Please try again in a moment.' });
    }

    res.status(500).json({ error: 'Failed to simplify text. Please try again.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Unpack API running on port ${PORT}`);
});