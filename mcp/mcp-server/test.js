require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log(process.env.GEMINI_API_KEY)
async function testModel() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent("Say hello!");
    const text = await result.response.text();
    console.log("Gemini response:", text);
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

testModel();
