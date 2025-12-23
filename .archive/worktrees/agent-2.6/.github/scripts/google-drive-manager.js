#!/usr/bin/env node

/**
 * Google Drive Manager for Patent Document Export
 * Handles Google Drive API operations for document upload and organization
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

class GoogleDriveManager {
  constructor(credentialsPath) {
    this.credentialsPath = credentialsPath;
    this.drive = null;
    this.auth = null;
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating with Google Drive...');
      
      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
      
      this.auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
      });

      const authClient = await this.auth.getClient();
      this.drive = google.drive({ version: 'v3', auth: authClient });
      
      console.log('✅ Google Drive authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Google Drive authentication failed:', error.message);
      return false;
    }
  }

  async createFolder(name, parentId) {
    try {
      const folderMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined
      };

      const response = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name'
      });

      console.log(`📁 Created folder: ${name} (${response.data.id})`);
      return response.data.id;
    } catch (error) {
      console.error(`❌ Failed to create folder ${name}:`, error.message);
      return null;
    }
  }

  async findFolder(name, parentId) {
    try {
      const query = `name='${name}' and mimeType='application/vnd.google-apps.folder'${parentId ? ` and '${parentId}' in parents` : ''}`;
      
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)'
      });

      return response.data.files.length > 0 ? response.data.files[0].id : null;
    } catch (error) {
      console.error(`❌ Failed to find folder ${name}:`, error.message);
      return null;
    }
  }

  async getOrCreateFolder(name, parentId) {
    let folderId = await this.findFolder(name, parentId);
    
    if (!folderId) {
      folderId = await this.createFolder(name, parentId);
    } else {
      console.log(`📁 Found existing folder: ${name} (${folderId})`);
    }
    
    return folderId;
  }

  async createFolderStructure(parentFolderId, organization) {
    console.log('📁 Creating folder structure...');
    
    const folders = {};
    
    // Create main Aurigraph Patents folder
    const mainFolderId = await this.getOrCreateFolder('Aurigraph DLT Patents', parentFolderId);
    folders.main = mainFolderId;
    
    if (organization === 'by-category') {
      folders.technical = await this.getOrCreateFolder('Technical Patents', mainFolderId);
      folders.business = await this.getOrCreateFolder('Business Method Patents', mainFolderId);
      folders.inventions = await this.getOrCreateFolder('Invention Disclosures', mainFolderId);
      folders.priorArt = await this.getOrCreateFolder('Prior Art Research', mainFolderId);
      folders.legal = await this.getOrCreateFolder('Legal Documents', mainFolderId);
      folders.specifications = await this.getOrCreateFolder('Technical Specifications', mainFolderId);
    } else if (organization === 'by-technology') {
      folders.quantum = await this.getOrCreateFolder('Quantum Technology', mainFolderId);
      folders.consensus = await this.getOrCreateFolder('Consensus Algorithms', mainFolderId);
      folders.crossChain = await this.getOrCreateFolder('Cross-Chain Technology', mainFolderId);
      folders.ai = await this.getOrCreateFolder('AI & Machine Learning', mainFolderId);
      folders.security = await this.getOrCreateFolder('Security & Cryptography', mainFolderId);
      folders.blockchain = await this.getOrCreateFolder('Blockchain Core', mainFolderId);
    } else if (organization === 'by-date') {
      const currentYear = new Date().getFullYear();
      folders[currentYear] = await this.getOrCreateFolder(currentYear.toString(), mainFolderId);
      folders[currentYear - 1] = await this.getOrCreateFolder((currentYear - 1).toString(), mainFolderId);
    }
    
    // Create metadata folder
    folders.metadata = await this.getOrCreateFolder('Export Metadata', mainFolderId);
    
    return folders;
  }

  async uploadFile(filePath, fileName, parentFolderId, description = '') {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [parentFolderId],
        description: description
      };

      const media = {
        mimeType: mime.lookup(filePath) || 'application/octet-stream',
        body: fs.createReadStream(filePath)
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, size, webViewLink'
      });

      console.log(`📤 Uploaded: ${fileName} (${response.data.id})`);
      return {
        id: response.data.id,
        name: response.data.name,
        size: response.data.size,
        webViewLink: response.data.webViewLink
      };
    } catch (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error.message);
      return null;
    }
  }

  async uploadDocuments(scanFile, parentFolderId, organization, includeMetadata) {
    console.log('📤 Starting document upload...');
    
    const scan = JSON.parse(fs.readFileSync(scanFile, 'utf8'));
    const folders = await this.createFolderStructure(parentFolderId, organization);
    
    const uploadResults = {
      uploaded: [],
      failed: [],
      skipped: []
    };

    if (scan.allDocuments) {
      for (const doc of scan.allDocuments) {
        try {
          if (!fs.existsSync(doc.path)) {
            console.log(`⚠️ File not found: ${doc.path}`);
            uploadResults.skipped.push({ file: doc.path, reason: 'File not found' });
            continue;
          }

          // Determine target folder based on document category and organization
          let targetFolderId = folders.main;
          
          if (organization === 'by-category') {
            if (doc.category === 'patent') targetFolderId = folders.technical;
            else if (doc.category === 'invention') targetFolderId = folders.inventions;
            else if (doc.category === 'legal') targetFolderId = folders.legal;
            else if (doc.category === 'technical') targetFolderId = folders.specifications;
            else if (doc.category === 'prior-art') targetFolderId = folders.priorArt;
          } else if (organization === 'by-technology') {
            if (doc.technology?.includes('quantum')) targetFolderId = folders.quantum;
            else if (doc.technology?.includes('consensus')) targetFolderId = folders.consensus;
            else if (doc.technology?.includes('cross-chain')) targetFolderId = folders.crossChain;
            else if (doc.technology?.includes('ai')) targetFolderId = folders.ai;
            else if (doc.technology?.includes('security')) targetFolderId = folders.security;
            else targetFolderId = folders.blockchain;
          } else if (organization === 'by-date') {
            const year = new Date(doc.lastModified || Date.now()).getFullYear();
            targetFolderId = folders[year] || folders.main;
          }

          // Create description with metadata
          let description = `Aurigraph DLT Patent Document\n`;
          description += `Category: ${doc.category || 'Unknown'}\n`;
          description += `Size: ${(doc.size / 1024).toFixed(1)} KB\n`;
          description += `Last Modified: ${doc.lastModified || 'Unknown'}\n`;
          if (doc.keywords) description += `Keywords: ${doc.keywords.join(', ')}\n`;
          if (doc.technology) description += `Technology: ${doc.technology.join(', ')}\n`;

          const result = await this.uploadFile(
            doc.path,
            doc.fileName || path.basename(doc.path),
            targetFolderId,
            description
          );

          if (result) {
            uploadResults.uploaded.push({
              ...doc,
              driveId: result.id,
              driveLink: result.webViewLink,
              uploadedSize: result.size
            });
          } else {
            uploadResults.failed.push({ file: doc.path, reason: 'Upload failed' });
          }

          // Rate limiting
          await this.sleep(100);
        } catch (error) {
          console.error(`❌ Error uploading ${doc.path}:`, error.message);
          uploadResults.failed.push({ file: doc.path, reason: error.message });
        }
      }
    }

    // Save upload results
    fs.writeFileSync('upload-results.json', JSON.stringify(uploadResults, null, 2));
    
    console.log(`📊 Upload completed:`);
    console.log(`  Uploaded: ${uploadResults.uploaded.length}`);
    console.log(`  Failed: ${uploadResults.failed.length}`);
    console.log(`  Skipped: ${uploadResults.skipped.length}`);

    return uploadResults;
  }

  async verifyExport(parentFolderId, scanFile) {
    console.log('✅ Verifying export...');
    
    const scan = JSON.parse(fs.readFileSync(scanFile, 'utf8'));
    
    // List all files in the parent folder and subfolders
    const query = `'${parentFolderId}' in parents`;
    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id, name, size, parents, mimeType)'
    });

    const driveFiles = response.data.files;
    const verification = {
      expectedFiles: scan.totalDocuments || 0,
      foundFiles: driveFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder').length,
      folders: driveFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder').length,
      verified: true
    };

    console.log(`📊 Verification results:`);
    console.log(`  Expected files: ${verification.expectedFiles}`);
    console.log(`  Found files: ${verification.foundFiles}`);
    console.log(`  Folders created: ${verification.folders}`);

    fs.writeFileSync('verification-results.json', JSON.stringify(verification, null, 2));
    
    return verification;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const getArg = (name) => {
    const index = args.indexOf(`--${name}`);
    return index !== -1 ? args[index + 1] : null;
  };

  const credentialsPath = getArg('credentials') || 'google-drive-credentials.json';
  const manager = new GoogleDriveManager(credentialsPath);

  (async () => {
    try {
      const authenticated = await manager.authenticate();
      if (!authenticated) {
        process.exit(1);
      }

      switch (command) {
        case 'create-folders':
          const parentFolder = getArg('parent-folder');
          const organization = getArg('organization') || 'by-category';
          await manager.createFolderStructure(parentFolder, organization);
          break;
          
        case 'upload-documents':
          const scanFile = getArg('scan-file');
          const parentFolderId = getArg('parent-folder');
          const org = getArg('organization') || 'by-category';
          const includeMetadata = getArg('include-metadata') === 'true';
          await manager.uploadDocuments(scanFile, parentFolderId, org, includeMetadata);
          break;
          
        case 'upload-file':
          const filePath = getArg('file');
          const fileName = getArg('name') || path.basename(filePath);
          const parentId = getArg('parent-folder');
          await manager.uploadFile(filePath, fileName, parentId);
          break;
          
        case 'verify-export':
          const parentId2 = getArg('parent-folder');
          const scanFile2 = getArg('scan-file');
          await manager.verifyExport(parentId2, scanFile2);
          break;
          
        default:
          console.log('Usage: node google-drive-manager.js <command> [options]');
          console.log('Commands: create-folders, upload-documents, upload-file, verify-export');
          process.exit(1);
      }
      
      console.log('✅ Google Drive operation completed');
      process.exit(0);
    } catch (error) {
      console.error(`❌ Operation failed: ${error.message}`);
      process.exit(1);
    }
  })();
}

module.exports = GoogleDriveManager;
