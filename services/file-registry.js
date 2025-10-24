const fs = require('fs');
const path = require('path');
const config = require('../config');

class FileRegistry {
  constructor() {
    this.registryPath = path.resolve(config.files.registryPath);
    this.registry = this.load();
  }

  /**
   * Load the file registry from JSON file
   * @returns {Object} Registry data
   */
  load() {
    try {
      if (fs.existsSync(this.registryPath)) {
        const data = fs.readFileSync(this.registryPath, 'utf8');
        const registry = JSON.parse(data);
        
        // Migrate old format to new format
        if (registry.baseFileId && !registry.agentFiles) {
          console.log('📦 Migrating registry to per-agent format...');
          return {
            agentFiles: {
              'brandoneats': registry.baseFileId,
              'claude-docubot': registry.baseFileId
            },
            files: registry.files || []
          };
        }
        
        return registry;
      }
    } catch (error) {
      console.warn('Failed to load file registry:', error.message);
    }
    
    // Return default structure with per-agent tracking
    return {
      agentFiles: {
        'brandoneats': null,
        'claude-docubot': null
      },
      files: []
    };
  }

  /**
   * Save the registry to JSON file
   */
  save() {
    try {
      fs.writeFileSync(
        this.registryPath,
        JSON.stringify(this.registry, null, 2),
        'utf8'
      );
      console.log('✅ File registry saved');
    } catch (error) {
      console.error('❌ Failed to save file registry:', error.message);
      throw error;
    }
  }

  /**
   * Get the base file ID for a specific agent
   * @param {string} agentName - Agent name ('brandoneats' or 'claude-docubot')
   * @returns {string|null} Base file ID for the agent
   */
  getBaseFile(agentName = null) {
    // Backward compatibility: if no agent specified, return first non-null file
    if (!agentName) {
      const files = this.registry.agentFiles || {};
      return files['claude-docubot'] || files['brandoneats'] || null;
    }
    
    if (!this.registry.agentFiles) {
      this.registry.agentFiles = {
        'brandoneats': null,
        'claude-docubot': null
      };
    }
    
    return this.registry.agentFiles[agentName] || null;
  }

  /**
   * Set the base file ID for a specific agent
   * @param {string} fileId - Claude file ID
   * @param {string} agentName - Agent name ('brandoneats' or 'claude-docubot')
   */
  setBaseFile(fileId, agentName = null) {
    if (!this.registry.agentFiles) {
      this.registry.agentFiles = {
        'brandoneats': null,
        'claude-docubot': null
      };
    }
    
    // If agent specified, set for that agent only
    if (agentName) {
      this.registry.agentFiles[agentName] = fileId;
      console.log(`✅ Base file for ${agentName} set to: ${fileId}`);
    } else {
      // If no agent specified, set for all agents (backward compatibility)
      this.registry.agentFiles['brandoneats'] = fileId;
      this.registry.agentFiles['claude-docubot'] = fileId;
      console.log(`✅ Base file set to: ${fileId} (all agents)`);
    }
    
    this.save();
  }

  /**
   * Get all agent file assignments
   * @returns {Object} Map of agent names to file IDs
   */
  getAllAgentFiles() {
    return this.registry.agentFiles || {
      'brandoneats': null,
      'claude-docubot': null
    };
  }

  /**
   * Get all registered files
   * @returns {Array} Array of file metadata
   */
  getAllFiles() {
    return this.registry.files;
  }

  /**
   * Add a file to the registry
   * @param {Object} fileData - File metadata (id, filename, mimeType, size, etc.)
   */
  addFile(fileData) {
    const fileEntry = {
      id: fileData.id,
      filename: fileData.filename,
      mimeType: fileData.mime_type || fileData.mimeType,
      sizeBytes: fileData.size_bytes || fileData.sizeBytes,
      uploadedAt: new Date().toISOString(),
      assignedToAgents: fileData.assignedToAgents || [],
      ...fileData
    };

    // Check if file already exists
    const existingIndex = this.registry.files.findIndex(f => f.id === fileData.id);
    if (existingIndex >= 0) {
      this.registry.files[existingIndex] = fileEntry;
      console.log(`✅ Updated file in registry: ${fileData.filename}`);
    } else {
      this.registry.files.push(fileEntry);
      console.log(`✅ Added file to registry: ${fileData.filename}`);
    }

    this.save();
    return fileEntry;
  }

  /**
   * Get file by ID
   * @param {string} fileId - Claude file ID
   * @returns {Object|null} File metadata
   */
  getFileById(fileId) {
    return this.registry.files.find(f => f.id === fileId) || null;
  }

  /**
   * Remove file from registry
   * @param {string} fileId - Claude file ID
   */
  removeFile(fileId) {
    const initialLength = this.registry.files.length;
    this.registry.files = this.registry.files.filter(f => f.id !== fileId);
    
    if (this.registry.files.length < initialLength) {
      // If this was the base file for any agent, clear it
      if (this.registry.agentFiles) {
        Object.keys(this.registry.agentFiles).forEach(agent => {
          if (this.registry.agentFiles[agent] === fileId) {
            this.registry.agentFiles[agent] = null;
          }
        });
      }
      this.save();
      console.log(`✅ Removed file from registry: ${fileId}`);
      return true;
    }
    return false;
  }
}

module.exports = new FileRegistry();

