# 🚀 Google Drive Patent Export Setup Guide

This guide will help you set up Google Drive API integration for automated patent document export from your GitHub repository.

## 📋 Overview

The Google Drive Patent Export system provides:
- ✅ **Automatic patent document identification** and categorization
- ✅ **Organized folder structure** in Google Drive
- ✅ **Bulk document upload** with metadata
- ✅ **Incremental updates** and duplicate detection
- ✅ **Comprehensive export reports** and verification
- ✅ **Multiple organization strategies** (by category, technology, date)

## 🔧 Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for later use

### Step 2: Enable Google Drive API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click on "Google Drive API" and click **Enable**

### Step 3: Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in the service account details:
   - **Name**: `aurigraph-patent-export`
   - **Description**: `Service account for automated patent document export`
4. Click **Create and Continue**
5. Skip the optional steps and click **Done**

### Step 4: Generate Service Account Key

1. In the **Credentials** page, find your service account
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** → **Create New Key**
5. Select **JSON** format and click **Create**
6. Save the downloaded JSON file securely

### Step 5: Share Google Drive Folder with Service Account

1. Open your Google Drive folder: https://drive.google.com/drive/folders/1z4e64CSULqcYqQPoiTNstuJaMRZ58O2W
2. Right-click and select **Share**
3. Add the service account email (from the JSON file) as an **Editor**
4. Click **Send**

### Step 6: Configure GitHub Repository Secret

1. Go to your GitHub repository: `https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Create a secret with:
   - **Name**: `GOOGLE_DRIVE_SERVICE_ACCOUNT`
   - **Value**: Paste the entire contents of the JSON file from Step 4

## 🎯 Usage Instructions

### Running the Export Workflow

1. Go to the **Actions** tab in your GitHub repository
2. Select **"Export Patent Documents to Google Drive"** workflow
3. Click **"Run workflow"**
4. Configure the export parameters:

#### Export Parameters

| Parameter | Options | Description |
|-----------|---------|-------------|
| **Export Mode** | `full-export`, `incremental-update`, `scan-only` | Type of export operation |
| **Document Types** | `all`, `patents-only`, `technical-docs`, `legal-docs`, `invention-disclosures` | Which documents to include |
| **Folder Organization** | `by-category`, `by-date`, `by-technology`, `flat-structure` | How to organize files |
| **Include Metadata** | `true`, `false` | Whether to include detailed metadata |
| **Dry Run** | `true`, `false` | Test mode without actual uploads |

### Export Modes

#### Full Export
- Scans entire repository for patent-related documents
- Uploads all found documents to Google Drive
- Creates complete folder structure
- Best for initial setup or complete refresh

#### Incremental Update
- Only uploads new or modified documents
- Compares with previous export metadata
- Faster for regular updates
- Maintains existing folder structure

#### Scan Only
- Identifies patent documents without uploading
- Generates detailed scan report
- Useful for analysis and planning
- No Google Drive operations performed

### Folder Organization Strategies

#### By Category (Recommended)
```
Aurigraph DLT Patents/
├── Technical Patents/
├── Business Method Patents/
├── Invention Disclosures/
├── Prior Art Research/
├── Legal Documents/
├── Technical Specifications/
└── Export Metadata/
```

#### By Technology
```
Aurigraph DLT Patents/
├── Quantum Technology/
├── Consensus Algorithms/
├── Cross-Chain Technology/
├── AI & Machine Learning/
├── Security & Cryptography/
├── Blockchain Core/
└── Export Metadata/
```

#### By Date
```
Aurigraph DLT Patents/
├── 2024/
├── 2023/
├── 2022/
└── Export Metadata/
```

## 📊 Document Identification

The system automatically identifies patent-related documents using:

### File Name Patterns
- Files containing: `patent`, `invention`, `intellectual-property`, `disclosure`
- Technical documents: `specification`, `whitepaper`, `architecture`, `design`
- Legal documents: `license`, `copyright`, `agreement`, `legal`

### Directory Patterns
- Folders: `patents/`, `ip/`, `legal/`, `docs/patents/`, `specifications/`

### Content Analysis
- **Patent keywords**: invention, novelty, claims, embodiment, prior art
- **Technical keywords**: algorithm, method, system, process, implementation
- **Technology areas**: quantum, consensus, cross-chain, AI, security, blockchain

### Supported File Types
- **Documents**: `.md`, `.txt`, `.pdf`, `.doc`, `.docx`, `.rtf`
- **Technical**: `.tex`, `.rst`, `.adoc`, `.html`, `.xml`
- **Data**: `.json`, `.yaml`, `.yml`

## 🔍 Monitoring and Reports

### Export Reports
Each export generates comprehensive reports including:
- **Document statistics** (count, size, categories)
- **Upload results** (success, failures, skipped)
- **Folder organization** details
- **Google Drive links** to uploaded files
- **Metadata** and verification results

### Artifacts
All exports create downloadable artifacts:
- **Scan results** (`patent-documents-scan.json`)
- **Export metadata** (`export-metadata.json`)
- **Upload results** (`upload-results.json`)
- **Document archive** (`aurigraph-patent-documents.zip`)
- **Export report** (`export-report.md`)

### Verification
The system automatically verifies exports by:
- Checking uploaded file counts
- Validating folder structure
- Comparing file sizes
- Generating verification reports

## 🔄 Automated Scheduling

### Weekly Automatic Export
The workflow is configured to run automatically:
- **Schedule**: Every Sunday at 3 AM UTC
- **Mode**: Incremental update
- **Types**: All document types
- **Organization**: By category

### Manual Triggers
You can manually trigger exports anytime:
- Full exports for complete refresh
- Incremental updates for recent changes
- Scan-only for analysis
- Custom configurations for specific needs

## 🛡️ Security and Privacy

### Service Account Permissions
- **Minimum required**: Google Drive API access
- **Scope**: Limited to specified folder only
- **No personal data**: Service account cannot access personal files

### Data Handling
- **Temporary storage**: Files processed in GitHub Actions runner
- **Automatic cleanup**: Sensitive files removed after export
- **Secure transmission**: All uploads use HTTPS
- **Access control**: Only authorized repository collaborators

### Best Practices
- **Regular key rotation**: Update service account keys periodically
- **Monitor access**: Review Google Drive sharing permissions
- **Audit exports**: Check export reports for unexpected files
- **Backup metadata**: Keep export metadata for recovery

## 🔧 Troubleshooting

### Common Issues

#### Authentication Failed
- **Cause**: Invalid service account credentials
- **Solution**: Regenerate service account key and update GitHub secret

#### Permission Denied
- **Cause**: Service account not shared with Google Drive folder
- **Solution**: Share folder with service account email as Editor

#### No Documents Found
- **Cause**: No patent-related documents in repository
- **Solution**: Check document identification patterns and file types

#### Upload Failed
- **Cause**: File size limits or network issues
- **Solution**: Check file sizes (max 5GB) and retry

### Debug Mode
Enable debug mode by:
1. Setting `dry_run` to `true` for testing
2. Checking workflow logs for detailed information
3. Downloading artifacts for analysis
4. Using `scan-only` mode for document identification

## 📞 Support

### Getting Help
- **GitHub Issues**: Report problems in the repository
- **Workflow Logs**: Check Actions tab for detailed logs
- **Export Reports**: Review generated reports for insights
- **Documentation**: Refer to this guide and inline comments

### Useful Links
- **Google Drive Folder**: https://drive.google.com/drive/folders/1z4e64CSULqcYqQPoiTNstuJaMRZ58O2W
- **Google Cloud Console**: https://console.cloud.google.com/
- **Google Drive API Documentation**: https://developers.google.com/drive/api
- **GitHub Actions Documentation**: https://docs.github.com/en/actions

---

**🎉 Your Google Drive patent export system is ready to use!**

Run your first export with `scan-only` mode to see what documents will be identified and organized.
