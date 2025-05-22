// File: tools/nlpRouterTool.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { loadTools } = require('./toolManager');

const name = 'nlp';
const API_KEY = process.env.GEMINI_API_KEY;
let genAI;

try {
  if (!API_KEY) {
    console.error('Warning: Gemini API key is not configured');
  } else {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
} catch (error) {
  console.error('Error initializing Gemini API:', error);
}

const loadedTools = loadTools(); // Single declaration

async function callGeminiAPI(model, prompt) {
  if (!API_KEY) throw new Error('Gemini API key is not configured');
  try {
    const result = await model.generateContent(prompt);
    return result.response;
  } catch (error) {
    console.error('Gemini API call failed:', error.message);
    throw new Error('Gemini API error');
  }
}

const actions = {
  async processQuery(params = {}) {
    if (!API_KEY) throw new Error('Gemini API key is not configured');
    if (!params.query) throw new Error('Query parameter is required');

    try {
      const tools = loadedTools;

      const toolDescriptions = Object.entries(tools).map(([toolName, actions]) => {
        const actionDescriptions = Object.keys(actions).map(actionName => {
          const funcStr = actions[actionName].toString();
          const paramMatch = funcStr.match(/async\s+\w+\s*\(\s*(\w+)\s*=\s*\{\s*\}/);
          const paramName = paramMatch ? paramMatch[1] : 'params';
          const requiredParams = [];
          const errorChecks = funcStr.match(/if\s*\(\s*!\s*params\.(\w+)/g);
          if (errorChecks) {
            errorChecks.forEach(check => {
              const param = check.match(/params\.(\w+)/)[1];
              requiredParams.push(param);
            });
          }
          return `- ${actionName}: ${requiredParams.length > 0 ? 'Requires parameters: ' + requiredParams.join(', ') : 'No required parameters'}`;
        }).join('\\n');
        return `Tool: ${toolName}\\nActions:\\n${actionDescriptions}`;
      }).join('\\n\\n');

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are an intelligent voice assistant router that determines how to handle user queries.

Available tools and their actions:
${toolDescriptions}

Based on the user's query: "${params.query}"

Please analyze if this is:
1. A GENERAL_QUESTION that requires factual information, conversation, or advice that doesn't need external tools
2. A TOOL_REQUEST that requires using one of the available tools listed above,also process the raw data carefully for example weather is sunnny or not 

If this is a GENERAL_QUESTION:
- Provide a direct, conversational answer
- Keep responses concise and natural for voice delivery

If this is a TOOL_REQUEST:
- Determine which tool and action should handle this request
- Specify what parameters should be passed to that action

Respond with a JSON object in this format:
{
  "queryType": "GENERAL_QUESTION" or "TOOL_REQUEST",
  "answer": "Direct answer if this is a general question" (only for GENERAL_QUESTION),
  "tool": "toolName" (only for TOOL_REQUEST),
  "action": "actionName" (only for TOOL_REQUEST),
  "params": {} (only for TOOL_REQUEST),
  "note": "Additional information if needed"
}`;

      const response = await callGeminiAPI(model, prompt);
      const text = response.text();

      let parsedResponse;
      try {
        const jsonMatch = text.match(/(\{[\s\S]*\})/);
      
        parsedResponse = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(text);
        console.log(parsedResponse);
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.log('Raw Gemini response:', text);
        return {
          queryType: null,
          result: null,
          error: 'Failed to parse response from Gemini'
        };
      }

      // Handle GENERAL_QUESTION case
      if (parsedResponse.queryType === "GENERAL_QUESTION") {
        return {
          queryType: "GENERAL_QUESTION",
          answer: parsedResponse.answer,
          note: parsedResponse.note || 'This is a general question not requiring tools'
        };
      }

      // Handle TOOL_REQUEST case
      if (parsedResponse.queryType === "TOOL_REQUEST") {
        // Validate tool and action exist
        if (!parsedResponse.tool || !parsedResponse.action) {
          return {
            queryType: "TOOL_REQUEST",
            execution_plan: parsedResponse,
            result: null,
            note: parsedResponse.note || 'Tool or action not specified'
          };
        }

        if (!tools[parsedResponse.tool] || !tools[parsedResponse.tool][parsedResponse.action]) {
          return {
            queryType: "TOOL_REQUEST",
            execution_plan: parsedResponse,
            result: null,
            note: `Tool or action not found: ${parsedResponse.tool}.${parsedResponse.action}`
          };
        }

        // Execute the tool
        const result = await tools[parsedResponse.tool][parsedResponse.action](parsedResponse.params || {});
        // Return the raw result without the second Gemini humanification request
    
        return {
          queryType: "TOOL_REQUEST",
          execution_plan: parsedResponse,
          raw_data: result
        };
      }

      // Handle unexpected response type
      return {
        queryType: null,
        execution_plan: parsedResponse,
        result: null,
        note: 'Unexpected response format from Gemini'
      };
    } catch (error) {
      console.error('NLP Router error:', error);
      return {
        queryType: null,
        result: null,
        error: error.message
      };
    }
  },

  // Updated handleQuery method to return raw data without humanification
  async handleQuery(params = {}) {
    if (!params.query) {
      return {
        error: 'Query parameter is required'
      };
    }

    try {
      const result = await this.processQuery(params);
      
      if (result.queryType === "GENERAL_QUESTION") {
        return {
          queryType: "GENERAL_QUESTION",
          response: result.answer,
          note: result.note
        };
      } else if (result.queryType === "TOOL_REQUEST") {
        
        return {
          queryType: "TOOL_REQUEST",
          tool_used: result.execution_plan?.tool,
          action_used: result.execution_plan?.action,
          raw_data: result.raw_data || null,
          note: result.note || "Tool execution complete"
        };
      } else {
        return {
          queryType: "ERROR",
          response: "I'm having trouble understanding that request.",
          error: result.error || "Unknown processing error"
        };
      }
    } catch (error) {
      console.error('Query handling error:', error);
      return {
        queryType: "ERROR",
        response: "Sorry, something went wrong while processing your request.",
        error: error.message
      };
    }
  },

  // Legacy method for backward compatibility
  async askNatural(params = {}) {
    return this.handleQuery(params);
  }
};

module.exports = {
  name,
  actions
};