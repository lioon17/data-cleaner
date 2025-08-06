"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, Database, ImageIcon, CheckCircle } from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"



export default function ExportStep({ analysisResults, cleanedData }) {
  const [exportOptions, setExportOptions] = useState({
    includeCleanedData: true,
    includeAnalysis: true,
    includeCharts: true,
    format: "csv",
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)

  const exportFormats = [
    { value: "csv", label: "CSV", icon: FileText, description: "Comma-separated values" },
    { value: "json", label: "JSON", icon: Database, description: "JavaScript Object Notation" },
    { value: "xlsx", label: "Excel", icon: ImageIcon, description: "Microsoft Excel format" },
  ]

  const handleExport = async (format) => {
    setIsExporting(true)

    // Simulate export process
    setTimeout(() => {
    const data = prepareExportData(format)
downloadFile(data, format)
      setIsExporting(false)
      setExportComplete(true)
    }, 2000)
  }

  const prepareExportData = (format) => {
    const exportData = {}

    if (exportOptions.includeCleanedData && cleanedData) {
      exportData.cleanedData = cleanedData
    }

    if (exportOptions.includeAnalysis && analysisResults) {
      exportData.analysis = {
        summary: analysisResults.results?.summary,
        insights: analysisResults.results?.insights,
        chartData: analysisResults.results?.chartData,
      }
    }

    return exportData
  }

 const downloadFile = (data, format) => {
  let content, filename, mimeType;

  switch (format) {
    case "json":
      content = new Blob([JSON.stringify(data.cleanedData || [], null, 2)], {
        type: "application/json",
      });
      filename = `data_export_${new Date().toISOString().split("T")[0]}.json`;
      mimeType = "application/json";
      break;

    case "csv":
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [
          Object.keys(data.cleanedData?.[0] || []).join(","),
          ...data.cleanedData.map((row) =>
            Object.values(row)
              .map((value) => `"${value}"`)
              .join(",")
          ),
        ].join("\n");

      content = new Blob([csvContent], { type: "text/csv" });
      filename = `data_export_${new Date().toISOString().split("T")[0]}.csv`;
      mimeType = "text/csv";
      break;

    case "xlsx":
      const worksheet = XLSX.utils.json_to_sheet(data.cleanedData || []);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      const xlsxBlob = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      content = new Blob([xlsxBlob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      filename = `data_export_${new Date().toISOString().split("T")[0]}.xlsx`;
      mimeType = content.type;
      break;

    default:
      console.warn("Unsupported export format:", format);
      return;
  }

  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};



  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ""

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    return csvContent
  }

  const getExportSummary = () => {
    const summary = {
      totalRows: cleanedData?.length || 0,
      totalFields: cleanedData?.[0] ? Object.keys(cleanedData[0]).length : 0,
      analysisGenerated: !!analysisResults?.results,
      chartsCreated: !!analysisResults?.results?.chartData,
    }

    return summary
  }

  const summary = getExportSummary()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">EXPORT RESULTS</h1>
          <p className="text-sm text-neutral-400">Download your cleaned data and analysis results</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">EXPORT OPTIONS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cleaned-data"
                    checked={exportOptions.includeCleanedData}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({ ...prev, includeCleanedData: checked }))
                    }
                    className="border-neutral-600"
                  />
                  <label htmlFor="cleaned-data" className="text-sm text-white">
                    Include cleaned data
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="analysis"
                    checked={exportOptions.includeAnalysis}
                    onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, includeAnalysis: checked }))}
                    className="border-neutral-600"
                  />
                  <label htmlFor="analysis" className="text-sm text-white">
                    Include analysis results
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={exportOptions.includeCharts}
                    onCheckedChange={(checked) => setExportOptions((prev) => ({ ...prev, includeCharts: checked }))}
                    className="border-neutral-600"
                  />
                  <label htmlFor="charts" className="text-sm text-white">
                    Include chart data
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">EXPORT SUMMARY</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Rows:</span>
                  <span className="text-white font-mono">{summary.totalRows}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Fields:</span>
                  <span className="text-white font-mono">{summary.totalFields}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Analysis:</span>
                  <Badge
                    className={
                      summary.analysisGenerated ? "bg-white/20 text-white" : "bg-neutral-700/20 text-neutral-500"
                    }
                  >
                    {summary.analysisGenerated ? "Generated" : "Not Available"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Charts:</span>
                  <Badge
                    className={summary.chartsCreated ? "bg-white/20 text-white" : "bg-neutral-700/20 text-neutral-500"}
                  >
                    {summary.chartsCreated ? "Created" : "Not Available"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {exportComplete && (
            <Card className="bg-neutral-900 border-green-500/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span className="text-sm font-medium">Export Complete!</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">Your files have been downloaded successfully</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Export Formats */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">DOWNLOAD FORMATS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exportFormats.map((format) => (
                  <div
                    key={format.value}
                    className="p-4 bg-neutral-800 rounded border border-neutral-700 hover:border-orange-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <format.icon className="w-6 h-6 text-orange-500" />
                      <div>
                        <h3 className="text-white font-medium">{format.label}</h3>
                        <p className="text-xs text-neutral-400">{format.description}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleExport(format.value)}
                      disabled={isExporting}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {isExporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download {format.label}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Preview */}
          {cleanedData && (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                  FINAL DATA PREVIEW
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-700">
                        {Object.keys(cleanedData[0] || {}).map((header) => (
                          <th key={header} className="text-left py-2 px-3 text-neutral-300 font-medium font-mono">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                <tbody>
  {(Array.isArray(cleanedData) ? cleanedData.slice(0, 5) : []).map((row, index) => (
    <tr key={index} className="border-b border-neutral-800">
      {Object.values(row).map((value, cellIndex) => (
        <td key={cellIndex} className="py-2 px-3 text-neutral-300 font-mono">
          {value === null || value === undefined ? (
            <span className="text-red-400 italic">null</span>
          ) : Array.isArray(value) ? (
            <span className="text-purple-400">[{value.join(", ")}]</span>
          ) : (
            String(value)
          )}
        </td>
      ))}
    </tr>
  ))}
</tbody>

                  </table>
                </div>
                {cleanedData.length > 5 && (
                  <div className="mt-4 text-center">
                    <span className="text-xs text-neutral-500">
                      Showing first 5 rows of {cleanedData.length} total rows
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analysis Results Preview */}
          {analysisResults?.results && (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">ANALYSIS SUMMARY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.results.insights && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Key Insights</h4>
                      <div className="space-y-1">
                        {analysisResults.results.insights.map((insight, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-neutral-300">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisResults.results.chartData && (
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Chart Data Points</h4>
                      <div className="text-xs text-neutral-400">
                        {analysisResults.results.chartData.length} data points generated for visualization
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
