// utils/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
const GEMINI_KEY=process.env.GEMINIKEY
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

export const getGeminiResponse = async (prompt: string) => {
  try {
    // First, get response from MCP server by sending the user prompt
    // Use the correct URL and port for your MCP server - adjust this to match your actual MCP server URL
    const mcpResponse = await axios.post('http://localhost:4000/api/ask', {
      query: prompt  // Send the user's query to the MCP server
    });
    
    // Extract the data from the MCP response
    const mcpData = mcpResponse.data;

    // Create context for Gemini with the MCP response included
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const context = `You are CruzLink, a helmet-mounted voice assistant for bike riders. Your responses must be:

    1. BRIEF - Keep responses brief
    2. CLEAR - Use simple language with excellent pronunciation for text-to-speech
    3. CONTEXTUALLY AWARE - Remember users are actively cycling and need minimal distraction
    4. SAFETY-FOCUSED - Occasionally remind about road awareness when relevant
    
    Your input is the raw MCP server response. Transform this data into natural, conversational speech appropriate for a cyclist in motion.
    Also if MCP response feels weird like if a general question is answered weirdly i.e MCP misinterpreting it and using some tool use the user query to generate response for the user which is good.
    
    User query: "${prompt}"
    MCP response: ${JSON.stringify(mcpData)}`;

    const result = await model.generateContent(context);
    const response = result.response;
     
    return response.text();
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Fallback to direct Gemini response if MCP fails
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const fallbackContext = `You are CruzLink, a helmet-mounted voice assistant for bike riders. Your responses must be:

      1. BRIEF - Keep responses brief
      2. CLEAR - Use simple language with excellent pronunciation for text-to-speech
      3. CONTEXTUALLY AWARE - Remember users are actively cycling and need minimal distraction
      4. SAFETY-FOCUSED - Occasionally remind about road awareness when relevant
      
      The MCP server is currently unavailable. Please respond directly to the user query in a helpful way.
      
      User query: "${prompt}"`;

      const result = await model.generateContent(fallbackContext);
      return result.response.text();
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      return "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
    }
  }
};
