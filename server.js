import express from "express"
import multer from "multer"
import cors from "cors"
import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"

// Import all the data processing utilities
import { loadFile } from "./utils/parser.js"
import { inferTypes } from "./utils/infer.js"
import { cleanRows } from "./utils/clean.js"
import { handleMissing } from "./utils/missing.js"
import { removeExactDuplicates } from "./utils/deduplicate.js"
import { addFeatures } from "./utils/feature.js"
import { detectOutliersByZScore } from "./utils/outliers.js"
import { validateRows } from "./utils/validate.js"
import { exportToJSON, exportToCSV } from "./utils/export.js"
import { generateBarChart, generateLineChart } from "./utils/charts.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Create uploads and output directories
const uploadsDir = path.join(__dirname, "uploads")
const outputDir = path.join(__dirname, "output")

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".csv", ".json"]
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error("Only CSV and JSON files are allowed"))
    }
  },
})

// Store processed data in memory (in production, use a database)
const dataStore = new Map()

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Data Analytics API is running",
    timestamp: new Date().toISOString(),
  })
})

// File upload and parsing endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const filePath = req.file.path
    const sessionId = Date.now().toString()

    // Load and parse the file
    const rawData = loadFile(filePath)

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return res.status(400).json({ error: "File contains no valid data" })
    }

    // Infer field types from the first row
    const fieldTypes = inferTypes(rawData[0])

    // Store the data with session ID
    dataStore.set(sessionId, {
      originalData: rawData,
      fieldTypes,
      fileName: req.file.originalname,
      uploadTime: new Date().toISOString(),
    })

    // Clean up uploaded file
    fs.unlinkSync(filePath)

    res.json({
      sessionId,
      fileName: req.file.originalname,
      rowCount: rawData.length,
      fieldTypes,
      preview: rawData.slice(0, 5),
      message: "File uploaded and parsed successfully",
    })
  } catch (error) {
    console.error("Upload error:", error)
    res.status(500).json({
      error: "Failed to process file",
      details: error.message,
    })
  }
})

// Data cleaning endpoint
app.post("/api/clean", async (req, res) => {
  try {
    const {
      sessionId,
      missingDataStrategy = "impute",
      deduplicationEnabled = true,
      selectedFields = [],
      customRules = [],
    } = req.body

    if (!sessionId || !dataStore.has(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" })
    }

    const session = dataStore.get(sessionId)
    let { originalData, fieldTypes } = session

    // Filter selected fields if specified
    if (selectedFields.length > 0) {
      originalData = originalData.map((row) => {
        const filtered = {}
        selectedFields.forEach((field) => {
          if (row.hasOwnProperty(field)) {
            filtered[field] = row[field]
          }
        })
        return filtered
      })

      // Update field types to only include selected fields
      const filteredTypes = {}
      selectedFields.forEach((field) => {
        if (fieldTypes[field]) {
          filteredTypes[field] = fieldTypes[field]
        }
      })
      fieldTypes = filteredTypes
    }

    // Step 1: Handle missing data
    let cleanedData = handleMissing(originalData, fieldTypes, missingDataStrategy)

    // Step 2: Clean and normalize values
    cleanedData = cleanRows(cleanedData, fieldTypes)

    // Step 3: Remove duplicates if enabled
    if (deduplicationEnabled) {
      const beforeCount = cleanedData.length
      cleanedData = removeExactDuplicates(cleanedData)
      console.log(`Removed ${beforeCount - cleanedData.length} duplicate rows`)
    }

    // Step 4: Add derived features
    cleanedData = addFeatures(cleanedData)

    // Step 5: Validate data
    cleanedData = validateRows(cleanedData)

    // Update session with cleaned data
    session.cleanedData = cleanedData
    session.cleaningConfig = {
      missingDataStrategy,
      deduplicationEnabled,
      selectedFields,
      customRules,
    }

    // Generate cleaning statistics
    const stats = {
      originalRows: originalData.length,
      cleanedRows: cleanedData.length,
      fieldsProcessed: Object.keys(fieldTypes).length,
      missingValuesHandled: missingDataStrategy,
      duplicatesRemoved: deduplicationEnabled,
    }

    res.json({
      sessionId,
      cleanedData: cleanedData.slice(0, 10), // Preview
      totalRows: cleanedData.length,
      stats,
      message: "Data cleaned successfully",
    })
  } catch (error) {
    console.error("Cleaning error:", error)
    res.status(500).json({
      error: "Failed to clean data",
      details: error.message,
    })
  }
})

// Data analysis endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { sessionId, analysisType = "summary", targetField, chartType = "bar" } = req.body

    if (!sessionId || !dataStore.has(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" })
    }

    const session = dataStore.get(sessionId)
    const { cleanedData, fieldTypes } = session

    if (!cleanedData) {
      return res.status(400).json({ error: "No cleaned data available. Run cleaning first." })
    }

    // Generate summary statistics
    const summary = generateSummaryStats(cleanedData, fieldTypes)

    // Detect outliers if numeric field is specified
    let outliers = []
    if (targetField && fieldTypes[targetField] === "number") {
      outliers = detectOutliersByZScore(cleanedData, targetField, 2)
    }

    // Generate chart data
    let chartData = []
    if (targetField) {
      chartData = generateChartData(cleanedData, targetField, chartType, fieldTypes)
    }

    // Generate insights
    const insights = generateInsights(cleanedData, targetField, fieldTypes, outliers)

    const analysisResults = {
      summary,
      chartData,
      outliers: outliers.slice(0, 10), // Limit outliers in response
      insights,
      targetField,
      chartType,
      totalRows: cleanedData.length,
    }

    // Store analysis results
    session.analysisResults = analysisResults

    res.json({
      sessionId,
      results: analysisResults,
      message: "Analysis completed successfully",
    })
  } catch (error) {
    console.error("Analysis error:", error)
    res.status(500).json({
      error: "Failed to analyze data",
      details: error.message,
    })
  }
})

// Export endpoint
app.post("/api/export", async (req, res) => {
  try {
    const { sessionId, format = "csv", includeAnalysis = true, includeCharts = false } = req.body

    if (!sessionId || !dataStore.has(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" })
    }

    const session = dataStore.get(sessionId)
    const { cleanedData, analysisResults, fileName } = session

    if (!cleanedData) {
      return res.status(400).json({ error: "No data to export" })
    }

    const timestamp = new Date().toISOString().split("T")[0]
    const baseFileName = fileName ? fileName.split(".")[0] : "data"

    let exportPath
    let downloadUrl

    if (format === "csv") {
      exportPath = path.join(outputDir, `${baseFileName}_cleaned_${timestamp}.csv`)
      exportToCSV(cleanedData, exportPath)
      downloadUrl = `/api/download/${path.basename(exportPath)}`
    } else if (format === "json") {
      const exportData = {
        metadata: {
          originalFileName: fileName,
          exportDate: new Date().toISOString(),
          totalRows: cleanedData.length,
          cleaningConfig: session.cleaningConfig,
        },
        data: cleanedData,
      }

      if (includeAnalysis && analysisResults) {
        exportData.analysis = analysisResults
      }

      exportPath = path.join(outputDir, `${baseFileName}_export_${timestamp}.json`)
      exportToJSON(exportData, exportPath)
      downloadUrl = `/api/download/${path.basename(exportPath)}`
    }

    // Generate charts if requested
    if (includeCharts && analysisResults && analysisResults.targetField) {
      try {
        const chartPath = path.join(outputDir, `${baseFileName}_chart_${timestamp}.png`)

        if (analysisResults.chartType === "line") {
          await generateLineChart(cleanedData, "joined", analysisResults.targetField, chartPath)
        } else {
          await generateBarChart(cleanedData, "spending_category", analysisResults.targetField, chartPath)
        }
      } catch (chartError) {
        console.warn("Chart generation failed:", chartError.message)
      }
    }

    res.json({
      sessionId,
      downloadUrl,
      fileName: path.basename(exportPath),
      format,
      message: "Export completed successfully",
    })
  } catch (error) {
    console.error("Export error:", error)
    res.status(500).json({
      error: "Failed to export data",
      details: error.message,
    })
  }
})

// File download endpoint
app.get("/api/download/:filename", (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(outputDir, filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" })
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Download error:", err)
        res.status(500).json({ error: "Failed to download file" })
      }
    })
  } catch (error) {
    console.error("Download error:", error)
    res.status(500).json({ error: "Failed to download file" })
  }
})

// Get session data endpoint
app.get("/api/session/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params

    if (!dataStore.has(sessionId)) {
      return res.status(404).json({ error: "Session not found" })
    }

    const session = dataStore.get(sessionId)

    res.json({
      sessionId,
      fileName: session.fileName,
      uploadTime: session.uploadTime,
      hasOriginalData: !!session.originalData,
      hasCleanedData: !!session.cleanedData,
      hasAnalysis: !!session.analysisResults,
      rowCount: session.cleanedData ? session.cleanedData.length : session.originalData?.length || 0,
    })
  } catch (error) {
    console.error("Session error:", error)
    res.status(500).json({ error: "Failed to get session data" })
  }
})

// Utility functions
function generateSummaryStats(data, fieldTypes) {
  const stats = {}
  const numericFields = Object.keys(fieldTypes).filter((key) => fieldTypes[key] === "number")

  numericFields.forEach((field) => {
    const values = data.map((row) => Number(row[field])).filter((v) => !isNaN(v))

    if (values.length > 0) {
      const sorted = values.sort((a, b) => a - b)
      stats[field] = {
        count: values.length,
        mean: (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2),
        median: sorted[Math.floor(sorted.length / 2)],
        min: Math.min(...values),
        max: Math.max(...values),
        std: Math.sqrt(
          values.reduce((sum, val) => sum + Math.pow(val - stats[field]?.mean || 0, 2), 0) / values.length,
        ).toFixed(2),
      }
    }
  })

  return stats
}

function generateChartData(data, field, chartType, fieldTypes) {
  if (!field || !data.length) return []

  const fieldType = fieldTypes[field]

  if (chartType === "bar" || chartType === "pie") {
    // Group by categories
    const counts = {}
    data.forEach((row) => {
      const value = row[field] || "unknown"
      counts[value] = (counts[value] || 0) + 1
    })

    return Object.entries(counts)
      .map(([label, value]) => ({
        label: String(label),
        value,
        percentage: ((value / data.length) * 100).toFixed(1),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10) // Limit to top 10
  }

  if (chartType === "line" && fieldType === "number") {
    return data
      .map((row, index) => ({
        x: index + 1,
        y: Number(row[field]) || 0,
        label: `Point ${index + 1}`,
      }))
      .slice(0, 50) // Limit to 50 points for performance
  }

  return []
}

function generateInsights(data, field, fieldTypes, outliers) {
  const insights = []

  if (!field || !data.length) {
    insights.push(`Dataset contains ${data.length} records`)
    insights.push(`${Object.keys(fieldTypes).length} fields detected`)
    return insights
  }

  const fieldType = fieldTypes[field]

  if (fieldType === "number") {
    const values = data.map((row) => Number(row[field])).filter((v) => !isNaN(v))
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    insights.push(`Average ${field}: ${mean.toFixed(2)}`)
    insights.push(`Range: ${min} to ${max}`)
    insights.push(`${values.length} valid numeric values`)

    if (outliers.length > 0) {
      insights.push(`${outliers.length} outliers detected`)
    }
  } else {
    const unique = new Set(data.map((row) => row[field])).size
    insights.push(`${unique} unique values in ${field}`)
    insights.push(`${data.length} total records analyzed`)
  }

  // Add feature-specific insights
  if (data[0]?.spending_category) {
    const categories = data.reduce((acc, row) => {
      acc[row.spending_category] = (acc[row.spending_category] || 0) + 1
      return acc
    }, {})

    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]
    if (topCategory) {
      insights.push(`Most common spending category: ${topCategory[0]} (${topCategory[1]} records)`)
    }
  }

  return insights
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error)
  res.status(500).json({
    error: "Internal server error",
    details: error.message,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Data Analytics API server running on port ${PORT}`)
  console.log(`📁 Uploads directory: ${uploadsDir}`)
  console.log(`📁 Output directory: ${outputDir}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
})

export default app
