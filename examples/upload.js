/**
 * Example script to upload a file to Claude's Files API
 * 
 * Usage:
 *   node examples/upload.js /path/to/your/file.pdf [agent]
 * 
 * Arguments:
 *   file path - Required. Path to the file to upload
 *   agent     - Optional. Agent to assign file to: 'brandoneats' or 'claude-docubot'
 *               If not specified, file is uploaded but not assigned to any agent
 * 
 * Examples:
 *   node examples/upload.js data.csv brandoneats
 *   node examples/upload.js document.pdf claude-docubot
 */

const { uploadFileToClaude, getBaseFileInfo, getAllAgentFiles } = require('../services/file-upload');
const path = require('path');

async function main() {
  // Get arguments from command line
  const filePath = process.argv[2];
  const agentName = process.argv[3]; // Optional agent name

  if (!filePath) {
    console.error('\n❌ Please provide a file path as an argument');
    console.log('\nUsage:');
    console.log('  node examples/upload.js /path/to/your/file.pdf [agent]\n');
    console.log('Arguments:');
    console.log('  file path - Required. Path to the file to upload');
    console.log('  agent     - Optional. Agent name: "brandoneats" or "claude-docubot"\n');
    console.log('Examples:');
    console.log('  node examples/upload.js data.csv brandoneats');
    console.log('  node examples/upload.js document.pdf claude-docubot\n');
    console.log('Supported file types: PDF, TXT, CSV, JSON, MD, HTML, XML\n');
    process.exit(1);
  }

  // Validate agent name if provided
  if (agentName && !['brandoneats', 'claude-docubot'].includes(agentName)) {
    console.error('\n❌ Invalid agent name. Use "brandoneats" or "claude-docubot"\n');
    process.exit(1);
  }

  // Resolve to absolute path
  const absolutePath = path.resolve(filePath);

  console.log('\n📤 Starting file upload...');
  console.log(`File: ${absolutePath}`);
  if (agentName) {
    console.log(`Agent: ${agentName}`);
  }
  console.log('');

  try {
    // Upload the file and set as base file for specified agent
    const result = await uploadFileToClaude(absolutePath, {
      setAsBase: true,
      agent: agentName
    });

    console.log('\n✅ SUCCESS! File uploaded.');
    console.log('\nFile Details:');
    console.log(`  ID: ${result.fileId}`);
    console.log(`  Name: ${result.filename}`);
    console.log(`  Type: ${result.mimeType}`);
    console.log(`  Size: ${result.sizeBytes} bytes`);
    console.log(`  Uploaded: ${result.uploadedAt}`);

    if (agentName) {
      console.log(`\n🤖 The ${agentName} agent will now reference this file in responses!`);
      console.log('\nNext steps:');
      if (agentName === 'brandoneats') {
        console.log('  1. Configure A1Zap webhook: POST /webhook/brandoneats');
      } else {
        console.log('  1. Configure A1Zap webhook: POST /webhook/claude');
      }
      console.log('  2. Start chatting with your agent');
      console.log('  3. Ask questions about the document\n');
    } else {
      console.log('\n💡 File uploaded but not assigned to any agent.');
      console.log('   To assign to an agent, re-run with agent name as second argument.\n');
    }

    // Show all agent files
    console.log('📄 Current agent file assignments:');
    const agentFiles = getAllAgentFiles();
    for (const [agent, fileInfo] of Object.entries(agentFiles)) {
      if (fileInfo) {
        console.log(`  ${agent}: ${fileInfo.filename}`);
      } else {
        console.log(`  ${agent}: (no file assigned)`);
      }
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  - Check that the file exists');
    console.log('  - Verify file type is supported (PDF, TXT, CSV, JSON, MD, HTML, XML)');
    console.log('  - Ensure CLAUDE_API_KEY is set in config.js or environment variables');
    console.log('  - Check file size (Claude has limits on file size)');
    console.log('  - Verify agent name is correct: "brandoneats" or "claude-docubot"\n');
    process.exit(1);
  }
}

// Run the script
main();

