require('dotenv').config();
const { generateSimplification } = require('./llm');

const TEST_TEXT = "The utilization of the mechanism was executed with high efficiency.";

async function test() {
    console.log("--- Testing Default (Anthropic) ---");
    try {
        // This relies on ANTHROPIC_API_KEY being present
        const result = await generateSimplification(TEST_TEXT);
        console.log("Default Result:", result);
    } catch (e) {
        console.error("Default (Anthropic) failed (expected if key missing):", e.message);
    }

    console.log("\n--- Testing Gemini (Explicit) ---");
    try {
        // This relies on GEMINI_API_KEY being present
        const result = await generateSimplification(TEST_TEXT, 'gemini');
        console.log("Gemini Result:", result);
    } catch (e) {
        console.error("Gemini failed (expected if key missing):", e.message);
    }
}

test();
