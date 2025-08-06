"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, BarChart3 } from "lucide-react"

export default function CleanStep({ onComplete, uploadedData, data }) {
  const [cleaningConfig, setCleaningConfig] = useState(
    data?.config || {
      missingDataStrategy: "drop",
      deduplicationEnabled: true,
      selectedFields: Object.keys(uploadedData?.fieldTypes || {}),
      customRules: [],
    },
  )

  const [isProcessing, setIsProcessing] = useState(false)
  const [cleanedPreview, setCleanedPreview] = useState(data?.cleanedData || null)

  const missingDataStrategies = [
    { value: "drop", label: "Drop rows with missing data", description: "Remove entire rows containing null values" },
    { value: "impute_mean", label: "Impute with mean", description: "Replace missing numbers with column average" },
    { value: "impute_mode", label: "Impute with mode", description: "Replace missing values with most common value" },
    { value: "flag", label: "Flag missing data", description: "Keep data but mark missing values" },
  ]

  const handleFieldToggle = (field, checked) => {
    setCleaningConfig((prev) => ({
      ...prev,
      selectedFields: checked ? [...prev.selectedFields, field] : prev.selectedFields.filter((f) => f !== field),
    }))
  }

  const processData = async () => {
  setIsProcessing(true)

  try {
    const res = await fetch("/api/clean", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: localStorage.getItem("sessionId"),
        config: {
          missingStrategy: cleaningConfig.missingDataStrategy,
          deduplicate: cleaningConfig.deduplicationEnabled
        }
      })
    })

    if (!res.ok) throw new Error("Failed to clean data")

    const result = await res.json()
    setCleanedPreview(result.cleaned)
  } catch (err) {
    console.error("❌ Cleaning error:", err)
  }

  setIsProcessing(false)
}
  

  const getDataQualityStats = () => {
    if (!uploadedData?.parsedData) return null

    const original = uploadedData.parsedData
    const totalRows = original.length
    const totalFields = Object.keys(uploadedData.fieldTypes).length

    let missingValues = 0
    let duplicateRows = 0

    original.forEach((row) => {
      Object.values(row).forEach((value) => {
        if (value === null || value === undefined || value === "") {
          missingValues++
        }
      })
    })

    // Simple duplicate detection
    const seen = new Set()
    original.forEach((row) => {
      const key = JSON.stringify(row)
      if (seen.has(key)) {
        duplicateRows++
      } else {
        seen.add(key)
      }
    })

    return {
      totalRows,
      totalFields,
      missingValues,
      duplicateRows,
      missingPercentage: ((missingValues / (totalRows * totalFields)) * 100).toFixed(1),
    }
  }

  const stats = getDataQualityStats()

  const handleContinue = () => {
    onComplete({
      config: cleaningConfig,
      cleanedData: cleanedPreview,
      originalData: uploadedData.parsedData,
      stats: stats,
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">DATA CLEANING</h1>
          <p className="text-sm text-neutral-400">Configure cleaning rules and preview results</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Data Quality Overview */}
          {stats && (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                  DATA QUALITY OVERVIEW
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-neutral-400">Total Rows</div>
                    <div className="text-white font-mono text-lg">{stats.totalRows}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Total Fields</div>
                    <div className="text-white font-mono text-lg">{stats.totalFields}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Missing Values</div>
                    <div className="text-red-400 font-mono text-lg">{stats.missingValues}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Duplicates</div>
                    <div className="text-orange-400 font-mono text-lg">{stats.duplicateRows}</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-neutral-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Data Completeness</span>
                    <span className="text-white font-mono">
                      {(100 - Number.parseFloat(stats.missingPercentage)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missing Data Strategy */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                MISSING DATA STRATEGY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={cleaningConfig.missingDataStrategy}
                onValueChange={(value) => setCleaningConfig((prev) => ({ ...prev, missingDataStrategy: value }))}
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600">
                  {missingDataStrategies.map((strategy) => (
                    <SelectItem key={strategy.value} value={strategy.value} className="text-white hover:bg-neutral-700">
                      <div>
                        <div className="font-medium">{strategy.label}</div>
                        <div className="text-xs text-neutral-400">{strategy.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Deduplication */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">DEDUPLICATION</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deduplication"
                  checked={cleaningConfig.deduplicationEnabled}
                  onCheckedChange={(checked) =>
                    setCleaningConfig((prev) => ({ ...prev, deduplicationEnabled: checked }))
                  }
                  className="border-neutral-600"
                />
                <label htmlFor="deduplication" className="text-sm text-white">
                  Remove duplicate rows
                </label>
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                Automatically detect and remove identical rows from the dataset
              </p>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">FIELD SELECTION</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(uploadedData?.fieldTypes || {}).map(([field, info]) => (
                  <div key={field} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={cleaningConfig.selectedFields.includes(field)}
                        onCheckedChange={(checked) => handleFieldToggle(field, checked)}
                        className="border-neutral-600"
                      />
                      <label htmlFor={field} className="text-sm text-white font-mono">
                        {field}
                      </label>
                    </div>
                    <Badge
                      className={`text-xs ${
                        info.type === "string"
                          ? "bg-blue-500/20 text-blue-400"
                          : info.type === "integer" || info.type === "number"
                            ? "bg-white/20 text-white"
                            : "bg-neutral-500/20 text-neutral-400"
                      }`}
                    >
                      {info.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Process Button */}
          <Button
            onClick={processData}
            disabled={isProcessing}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Filter className="w-4 h-4 mr-2" />
                Apply Cleaning Rules
              </>
            )}
          </Button>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-6">
          {cleanedPreview ? (
            <>
              <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                    CLEANED DATA PREVIEW ({cleanedPreview.length} rows)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-700">
                          {Object.keys(cleanedPreview[0] || {}).map((header) => (
                            <th key={header} className="text-left py-2 px-3 text-neutral-300 font-medium font-mono">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cleanedPreview.slice(0, 10).map((row, index) => (
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
                  {cleanedPreview.length > 10 && (
                    <div className="mt-4 text-center">
                      <span className="text-xs text-neutral-500">
                        Showing first 10 rows of {cleanedPreview.length} total rows
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleContinue} className="bg-orange-500 hover:bg-orange-600 text-white">
                  Continue to Analysis
                  <BarChart3 className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="p-12 text-center">
                <Filter className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-400 mb-2">No Preview Available</h3>
                <p className="text-neutral-500">
                  Configure your cleaning rules and click "Apply Cleaning Rules" to see the preview
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
