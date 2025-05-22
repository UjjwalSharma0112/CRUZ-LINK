// File: server.js (updated with natural language endpoint)
// Updated server file with natural language endpoint

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { loadTools } = require('./tools/toolManager');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form data

// Load all tools
const tools = loadTools();

// Simple natural language API endpoint
app.post('/api/ask', async (req, res) => {
  try {
    const query = req.body.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    if (!tools.nlp || !tools.nlp.askNatural) {
      return res.status(500).json({ error: 'Natural language processing is not available' });
    }
    
    const result = await tools.nlp.askNatural({ query });
    
    res.json(result);
  } catch (error) {
    console.error('Error processing natural language query:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred processing your request'
    });
  }
});

// MCP routes
app.post('/api/mcp', (req, res) => {
  const { tool, action, params } = req.body;
  
  if (!tool || !action) {
    return res.status(400).json({ error: 'Tool and action are required' });
  }
  
  if (!tools[tool]) {
    return res.status(404).json({ error: `Tool '${tool}' not found` });
  }
  
  if (!tools[tool][action]) {
    return res.status(404).json({ error: `Action '${action}' not found in tool '${tool}'` });
  }
  
  // Execute the tool action
  tools[tool][action](params)
    .then(result => res.json({ success: true, data: result }))
    .catch(error => res.status(500).json({ 
      success: false, 
      error: error.message || 'An error occurred'
    }));
});

// Get available tools and actions
app.get('/api/mcp/tools', (req, res) => {
  const availableTools = {};
  
  Object.keys(tools).forEach(toolName => {
    availableTools[toolName] = Object.keys(tools[toolName]);
  });
  
  res.json({ tools: availableTools });
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});