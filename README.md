This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Data Analytics API Backend

A comprehensive Express.js API backend that powers the cyberpunk data analytics dashboard. This API provides a complete data processing pipeline with file upload, cleaning, analysis, and export capabilities.

## Features

### 🚀 Core Functionality
- **File Upload & Parsing**: Support for CSV and JSON files up to 100MB
- **Data Type Inference**: Automatically detect field types (string, number, boolean, date)
- **Data Cleaning**: Multiple strategies for handling missing data, duplicates, and normalization
- **Feature Engineering**: Add derived features like spending categories and time-based metrics
- **Outlier Detection**: Statistical outlier detection using Z-score and threshold methods
- **Data Validation**: Schema and business logic validation
- **Export Options**: Export cleaned data in CSV, JSON, and Excel formats
- **Chart Generation**: Create bar charts, line charts, and visualizations

### 🔧 API Endpoints

#### File Operations
- `POST /api/upload` - Upload and parse CSV/JSON files
- `GET /api/download/:filename` - Download exported files

#### Data Processing
- `POST /api/clean` - Clean data with configurable options
- `POST /api/analyze` - Generate analysis and insights
- `POST /api/export` - Export processed data

#### Session Management
- `GET /api/session/:sessionId` - Get session information
- `GET /api/health` - API health check

## Installation

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
\`\`\`

## Usage

### 1. Upload File
\`\`\`javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const { sessionId, fieldTypes, preview } = await response.json();
\`\`\`

### 2. Clean Data
\`\`\`javascript
const cleanConfig = {
  sessionId,
  missingDataStrategy: 'impute', // 'drop', 'impute', 'flag'
  deduplicationEnabled: true,
  selectedFields: ['name', 'email', 'amount']
};

const response = await fetch('/api/clean', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cleanConfig)
});
\`\`\`

### 3. Analyze Data
\`\`\`javascript
const analysisConfig = {
  sessionId,
  targetField: 'amount',
  chartType: 'bar' // 'bar', 'line', 'pie'
};

const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(analysisConfig)
});
\`\`\`

### 4. Export Results
\`\`\`javascript
const exportConfig = {
  sessionId,
  format: 'csv', // 'csv', 'json', 'xlsx'
  includeAnalysis: true,
  includeCharts: true
};

const response = await fetch('/api/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(exportConfig)
});

const { downloadUrl } = await response.json();
\`\`\`

## Data Processing Pipeline

### 1. **File Upload & Parsing**
- Supports CSV and JSON formats
- Automatic field type inference
- Data validation and error handling

### 2. **Data Cleaning**
- **Missing Data Handling**:
  - Drop: Remove rows with missing values
  - Impute: Fill missing values with defaults
  - Flag: Mark missing values with boolean flags

- **Deduplication**:
  - Remove exact duplicate rows
  - Custom key-based deduplication

- **Data Normalization**:
  - Clean and standardize string values
  - Parse numbers and dates
  - Boolean value normalization

### 3. **Feature Engineering**
- Calculate days since joined
- Categorize spending levels (high/medium/low)
- Add high-value customer flags
- Custom derived features

### 4. **Analysis & Insights**
- Statistical summaries (mean, median, std dev)
- Outlier detection using Z-score analysis
- Chart data generation for visualizations
- Automated insight generation

### 5. **Export & Visualization**
- Multiple export formats (CSV, JSON, Excel)
- Chart generation (PNG images)
- Comprehensive metadata inclusion

## Configuration

### Environment Variables
\`\`\`bash
PORT=3001                    # Server port
NODE_ENV=development         # Environment
MAX_FILE_SIZE=104857600     # 100MB file size limit
\`\`\`

### File Structure
\`\`\`
├── server.js              # Main Express server
├── utils/                 # Data processing utilities
│   ├── parser.js          # File parsing
│   ├── infer.js           # Type inference
│   ├── clean.js           # Data cleaning
│   ├── missing.js         # Missing data handling
│   ├── deduplicate.js     # Duplicate removal
│   ├── feature.js         # Feature engineering
│   ├── outliers.js        # Outlier detection
│   ├── validate.js        # Data validation
│   ├── export.js          # Export functionality
│   └── charts.js          # Chart generation
├── uploads/               # Temporary file uploads
├── output/                # Generated exports
└── package.json
\`\`\`

## Error Handling

The API includes comprehensive error handling:
- File validation and size limits
- Data parsing error recovery
- Session management validation
- Detailed error messages and logging

## Security Features

- File type validation (CSV/JSON only)
- File size limits (100MB max)
- Input sanitization and validation
- CORS configuration for cross-origin requests

## Performance Considerations

- In-memory session storage (use Redis/database for production)
- File cleanup after processing
- Streaming for large file operations
- Pagination for large datasets

## Integration with React Frontend

The API is designed to work seamlessly with the cyberpunk React dashboard:

\`\`\`javascript
import DataAnalyticsAPI from './api-client.js';

const api = new DataAnalyticsAPI('http://localhost:3001/api');

// Upload file
const uploadResult = await api.uploadFile(file);

// Clean data
const cleanResult = await api.cleanData(sessionId, cleanConfig);

// Analyze data
const analysisResult = await api.analyzeData(sessionId, analysisConfig);

// Export results
const exportResult = await api.exportData(sessionId, exportConfig);
\`\`\`

This backend provides a complete data analytics pipeline that transforms raw data into actionable insights through a cyberpunk-themed interface.
