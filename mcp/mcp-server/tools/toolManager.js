// File: tools/toolManager.js
// Manages loading and registering tools
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load all tools from the tools directory
function loadTools() {
  const tools = {};
  const toolsDir = path.join(__dirname);
  
  // Read all files in the tools directory
  const files = fs.readdirSync(toolsDir);
  
  // Filter out non-tool files
  files.forEach(file => {
    // Skip the tool manager itself and non-js files
    if (file === 'toolManager.js' || !file.endsWith('.js')) {
      return;
    }
    
    try {
      // Load the tool
      const toolPath = path.join(toolsDir, file);
      const tool = require(toolPath);
      
      // Register the tool if it has a name
      if (tool.name) {
        tools[tool.name] = tool.actions;
      }
    } catch (error) {
      console.error(`Error loading tool ${file}:`, error);
    }
  });
  
  return tools;
}

module.exports = {
  loadTools
};
