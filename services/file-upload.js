const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const fileRegistry = require('./file-registry');

/**
 * Upload a file to Claude's Files API
 * @param {string} filePath - Path to the file to upload
 * @param {Object} options - Upload options
 * @param {boolean} options.setAsBase - Set this file as the base file (default: false)
 * @param {string} options.agent - Agent name to assign file to ('brandoneats' or 'claude-docubot')
 * @returns {Promise<Object>} File metadata including ID
 */
async function uploadFileToClaude(filePath, options = {}) {
  try {
    console.log(`\n📤 Uploading file to Claude: ${filePath}`);

    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    
    console.log(`File size: ${stats.size} bytes`);

    // Determine MIME type based on extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.xml': 'application/xml'
    };

    const mimeType = mimeTypes[ext];
    if (!mimeType) {
      throw new Error(`Unsupported file type: ${ext}. Supported types: PDF, TXT, CSV, JSON, MD, HTML, XML`);
    }

    console.log(`MIME type: ${mimeType}`);

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: config.claude.apiKey
    });

    // Create a read stream for the file
    const fileStream = fs.createReadStream(filePath);

    // Upload the file using Files API (beta)
    console.log('Uploading to Claude Files API...');
    const fileUpload = await anthropic.beta.files.upload({
      file: fileStream,
      purpose: 'user_upload'
    });

    console.log('✅ File uploaded successfully!');
    console.log(`File ID: ${fileUpload.id}`);

    // Store in registry
    const assignedToAgents = options.agent ? [options.agent] : [];
    const fileEntry = fileRegistry.addFile({
      id: fileUpload.id,
      filename: fileUpload.filename || filename,
      mimeType: mimeType,
      sizeBytes: fileUpload.size_bytes || stats.size,
      originalPath: filePath,
      assignedToAgents: assignedToAgents
    });

    // Set as base file if requested
    if (options.setAsBase) {
      if (options.agent) {
        fileRegistry.setBaseFile(fileUpload.id, options.agent);
        console.log(`✅ Set as base file for ${options.agent} agent`);
      } else {
        fileRegistry.setBaseFile(fileUpload.id);
        console.log('✅ Set as base file for all agents');
      }
    }

    return {
      success: true,
      fileId: fileUpload.id,
      filename: fileEntry.filename,
      mimeType: fileEntry.mimeType,
      sizeBytes: fileEntry.sizeBytes,
      uploadedAt: fileEntry.uploadedAt
    };

  } catch (error) {
    console.error('❌ File upload failed:', error.message);
    throw error;
  }
}

/**
 * Get information about the current base file for an agent
 * @param {string} agentName - Agent name ('brandoneats' or 'claude-docubot')
 * @returns {Object|null} Base file information or null if not set
 */
function getBaseFileInfo(agentName = null) {
  const baseFileId = fileRegistry.getBaseFile(agentName);
  if (!baseFileId) {
    return null;
  }

  const fileInfo = fileRegistry.getFileById(baseFileId);
  return fileInfo;
}

/**
 * Get all agent file assignments
 * @returns {Object} Map of agent names to their base file info
 */
function getAllAgentFiles() {
  const agentFiles = fileRegistry.getAllAgentFiles();
  const result = {};
  
  Object.keys(agentFiles).forEach(agent => {
    const fileId = agentFiles[agent];
    result[agent] = fileId ? fileRegistry.getFileById(fileId) : null;
  });
  
  return result;
}

/**
 * List all uploaded files
 * @returns {Array} Array of file metadata
 */
function listUploadedFiles() {
  return fileRegistry.getAllFiles();
}

module.exports = {
  uploadFileToClaude,
  getBaseFileInfo,
  getAllAgentFiles,
  listUploadedFiles
};

