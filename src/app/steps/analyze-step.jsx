"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, LineChart, PieChart, TrendingUp, Download } from "lucide-react"

export default function AnalyzeStep({ onComplete, cleanedData, data }) {
  const [selectedChart, setSelectedChart] = useState("bar")
  const [selectedField, setSelectedField] = useState("")
  const [analysisResults, setAnalysisResults] = useState(data?.results || null)
  const [isGenerating, setIsGenerating] = useState(false)

  const chartTypes = [
    { value: "bar", label: "Bar Chart", icon: BarChart3, description: "Compare categories" },
    { value: "line", label: "Line Chart", icon: LineChart, description: "Show trends over time" },
    { value: "pie", label: "Pie Chart", icon: PieChart, description: "Show proportions" },
  ]

  const getNumericFields = () => {
    if (!cleanedData?.cleanedData?.[0]) return []

    const sample = cleanedData.cleanedData[0]
    return Object.keys(sample).filter((key) => {
      const value = sample[key]
      return typeof value === "number" || !isNaN(Number(value))
    })
  }

  const getCategoricalFields = () => {
    if (!cleanedData?.cleanedData?.[0]) return []

    const sample = cleanedData.cleanedData[0]
    return Object.keys(sample).filter((key) => {
      const value = sample[key]
      return typeof value === "string" || typeof value === "boolean"
    })
  }

const generateAnalysis = async () => {
  setIsGenerating(true);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cleanedData: cleanedData.cleanedData,
        field: selectedField,
        chartType: selectedChart,
      }),
    });

    const { results } = await response.json();
    setAnalysisResults(results);
  } catch (error) {
    console.error("Failed to analyze:", error);
  } finally {
    setIsGenerating(false);
  }
};

  

  const simulateAnalysis = (data, field, chartType) => {
    const summary = generateSummaryStats(data)
    const chartData = generateChartData(data, field, chartType)

    return {
      summary,
      chartData,
      field,
      chartType,
      insights: generateInsights(data, field),
    }
  }

  const generateSummaryStats = (data) => {
    const numericFields = getNumericFields()
    const stats = {}

    numericFields.forEach((field) => {
      const values = data.map((row) => Number(row[field])).filter((v) => !isNaN(v))
      if (values.length > 0) {
        stats[field] = {
          count: values.length,
          mean: (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2),
          min: Math.min(...values),
          max: Math.max(...values),
          median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        }
      }
    })

    return stats
  }

  const generateChartData = (data, field, chartType) => {
    if (!field) return []

    if (chartType === "bar" || chartType === "pie") {
      // Group by categories
      const counts = {}
      data.forEach((row) => {
        const value = row[field]
        counts[value] = (counts[value] || 0) + 1
      })

      return Object.entries(counts).map(([label, value]) => ({
        label,
        value,
        percentage: ((value / data.length) * 100).toFixed(1),
      }))
    } else if (chartType === "line") {
      // For line chart, simulate time series data
      return data.slice(0, 10).map((row, index) => ({
        x: index + 1,
        y: Number(row[field]) || 0,
        label: `Point ${index + 1}`,
      }))
    }

    return []
  }

  const generateInsights = (data, field) => {
    const insights = []

    if (getNumericFields().includes(field)) {
      const values = data.map((row) => Number(row[field])).filter((v) => !isNaN(v))
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length
      const max = Math.max(...values)
      const min = Math.min(...values)

      insights.push(`Average ${field}: ${mean.toFixed(2)}`)
      insights.push(`Range: ${min} to ${max}`)
      insights.push(`${values.length} valid data points`)
    } else {
      const unique = new Set(data.map((row) => row[field])).size
      insights.push(`${unique} unique values in ${field}`)
      insights.push(`${data.length} total records`)
    }

    return insights
  }

  const renderChart = () => {
    if (!analysisResults?.chartData) return null

    const { chartData, chartType } = analysisResults

    if (chartType === "bar") {
      return (
        <div className="space-y-4">
          <div className="h-64 flex items-end justify-center space-x-2">
            {chartData.slice(0, 8).map((item, index) => (
              <div key={index} className="flex flex-col items-center space-y-2">
                <div className="text-xs text-neutral-400 font-mono">{item.value}</div>
                <div
                  className="bg-orange-500 w-8 transition-all duration-500"
                  style={{
                    height: `${(item.value / Math.max(...chartData.map((d) => d.value))) * 200}px`,
                    minHeight: "4px",
                  }}
                ></div>
                <div className="text-xs text-neutral-400 max-w-16 truncate">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )
    } else if (chartType === "line") {
      return (
        <div className="h-64 relative">
          <svg className="w-full h-full">
            <polyline
              points={chartData
                .map(
                  (point, index) =>
                    `${(index / (chartData.length - 1)) * 100}%,${100 - (point.y / Math.max(...chartData.map((d) => d.y))) * 80}%`,
                )
                .join(" ")}
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            {chartData.map((point, index) => (
              <circle
                key={index}
                cx={`${(index / (chartData.length - 1)) * 100}%`}
                cy={`${100 - (point.y / Math.max(...chartData.map((d) => d.y))) * 80}%`}
                r="4"
                fill="#f97316"
                className="drop-shadow-sm"
              />
            ))}
          </svg>
        </div>
      )
    } else if (chartType === "pie") {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90">
              {chartData.slice(0, 6).map((item, index) => {
                const total = chartData.reduce((sum, d) => sum + d.value, 0)
                const percentage = (item.value / total) * 100
                const angle = (percentage / 100) * 360
                const startAngle = chartData.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0)

                const x1 = 96 + 80 * Math.cos((startAngle * Math.PI) / 180)
                const y1 = 96 + 80 * Math.sin((startAngle * Math.PI) / 180)
                const x2 = 96 + 80 * Math.cos(((startAngle + angle) * Math.PI) / 180)
                const y2 = 96 + 80 * Math.sin(((startAngle + angle) * Math.PI) / 180)

                const largeArcFlag = angle > 180 ? 1 : 0

                return (
                  <path
                    key={index}
                    d={`M 96 96 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                    className="opacity-80"
                  />
                )
              })}
            </svg>
          </div>
        </div>
      )
    }

    return null
  }

  const handleContinue = () => {
    onComplete({
      results: analysisResults,
      cleanedData: cleanedData.cleanedData,
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">DATA ANALYSIS</h1>
          <p className="text-sm text-neutral-400">Generate insights and visualizations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CHART CONFIGURATION</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Chart Type</label>
                <Select value={selectedChart} onValueChange={setSelectedChart}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-600">
                    {chartTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white hover:bg-neutral-700">
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-neutral-400">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-neutral-400 mb-2 block">Field to Analyze</label>
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                    <SelectValue placeholder="Select field..." />
                  </SelectTrigger>
               <SelectContent className="bg-neutral-800 border-neutral-600">
              <div className="px-3 py-1 text-xs text-neutral-400 uppercase">Numeric Fields</div>
              {getNumericFields().map((field) => (
                <SelectItem
                  key={field}
                  value={field}
                  className="text-white hover:bg-neutral-700"
                >
                  <span className="font-mono">{field}</span>
                </SelectItem>
              ))}

              <div className="px-3 py-1 mt-2 text-xs text-neutral-400 uppercase">Categorical Fields</div>
              {getCategoricalFields().map((field) => (
                <SelectItem
                  key={field}
                  value={field}
                  className="text-white hover:bg-neutral-700"
                >
                  <span className="font-mono">{field}</span>
                </SelectItem>
              ))}
            </SelectContent>
 
 
                </Select>
              </div>

              <Button
                onClick={generateAnalysis}
                disabled={!selectedField || isGenerating}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generate Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {analysisResults?.summary && (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                  SUMMARY STATISTICS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analysisResults.summary)
                    .slice(0, 3)
                    .map(([field, stats]) => (
                      <div key={field} className="p-3 bg-neutral-800 rounded">
                        <div className="text-sm font-medium text-white font-mono mb-2">{field}</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <div className="text-neutral-400">Mean</div>
                            <div className="text-white font-mono">{stats.mean}</div>
                          </div>
                          <div>
                            <div className="text-neutral-400">Count</div>
                            <div className="text-white font-mono">{stats.count}</div>
                          </div>
                          <div>
                            <div className="text-neutral-400">Min</div>
                            <div className="text-white font-mono">{stats.min}</div>
                          </div>
                          <div>
                            <div className="text-neutral-400">Max</div>
                            <div className="text-white font-mono">{stats.max}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Visualization Panel */}
        <div className="lg:col-span-3 space-y-6">
          {analysisResults ? (
            <>
              <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                    VISUALIZATION: {analysisResults.field?.toUpperCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent>{renderChart()}</CardContent>
              </Card>

              {analysisResults.insights && (
                <Card className="bg-neutral-900 border-neutral-700">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">KEY INSIGHTS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisResults.insights.map((insight, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-neutral-300">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={handleContinue} className="bg-orange-500 hover:bg-orange-600 text-white">
                  Continue to Export
                  <Download className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-400 mb-2">No Analysis Generated</h3>
                <p className="text-neutral-500">
                  Select a field and chart type, then click "Generate Analysis" to create visualizations
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
