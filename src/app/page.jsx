"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, BarChart3, Download, ChevronRight, Database, Filter, CheckCircle } from "lucide-react"
import UploadStep from "./steps/upload-step"
import CleanStep from "./steps/clean-step"
import AnalyzeStep from "./steps/analyze-step"
import ExportStep from "./steps/export-step"

export default function DataAnalyticsTool() {
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadedData, setUploadedData] = useState(null)
  const [cleanedData, setCleanedData] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)

  const steps = [
    {
      id: 0,
      name: "UPLOAD",
      icon: Upload,
      description: "Import your data files",
      status: uploadedData ? "completed" : currentStep === 0 ? "active" : "pending",
    },
    {
      id: 1,
      name: "CLEAN",
      icon: Filter,
      description: "Configure data cleaning",
      status: cleanedData ? "completed" : currentStep === 1 ? "active" : "pending",
    },
    {
      id: 2,
      name: "ANALYZE",
      icon: BarChart3,
      description: "Generate insights",
      status: analysisResults ? "completed" : currentStep === 2 ? "active" : "pending",
    },
    {
      id: 3,
      name: "EXPORT",
      icon: Download,
      description: "Download results",
      status: currentStep === 3 ? "active" : "pending",
    },
  ]

  const getStepStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-white/20 text-white"
      case "active":
        return "bg-orange-500/20 text-orange-500"
      case "pending":
        return "bg-neutral-700/20 text-neutral-500"
      default:
        return "bg-neutral-700/20 text-neutral-500"
    }
  }

  const getStepIcon = (status, IconComponent) => {
    if (status === "completed") {
      return <CheckCircle className="w-5 h-5" />
    }
    return <IconComponent className="w-5 h-5" />
  }

  const handleStepComplete = (stepData) => {
    switch (currentStep) {
      case 0:
        setUploadedData(stepData)
        setCurrentStep(1)
        break
      case 1:
        setCleanedData(stepData)
        setCurrentStep(2)
        break
      case 2:
        setAnalysisResults(stepData)
        setCurrentStep(3)
        break
      default:
        break
    }
  }

  const canNavigateToStep = (stepId) => {
    switch (stepId) {
      case 0:
        return true
      case 1:
        return uploadedData !== null
      case 2:
        return cleanedData !== null
      case 3:
        return analysisResults !== null
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex h-screen">
        {/* Sidebar Navigation */}
        <div className="w-80 bg-neutral-900 border-r border-neutral-700 flex flex-col">
          <div className="p-6 border-b border-neutral-700">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-6 h-6 text-orange-500" />
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">DATA ANALYTICS</h1>
            </div>
            <p className="text-neutral-500 text-xs">BINARY CORE CLASSIFIED</p>
          </div>

          <div className="flex-1 p-6">
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-sm font-medium text-neutral-300 tracking-wider mb-4">WORKFLOW PROGRESS</h2>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => canNavigateToStep(step.id) && setCurrentStep(step.id)}
                          disabled={!canNavigateToStep(step.id)}
                          className={`flex items-center gap-3 p-3 rounded transition-colors w-full text-left ${
                            step.status === "active"
                              ? "bg-orange-500 text-white"
                              : step.status === "completed"
                                ? "bg-neutral-800 text-white hover:bg-neutral-700"
                                : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                          }`}
                        >
                          {getStepIcon(step.status, step.icon)}
                          <div className="flex-1">
                            <div className="text-sm font-medium">{step.name}</div>
                            <div className="text-xs opacity-75">{step.description}</div>
                          </div>
                        </button>
                      </div>
                      {index < steps.length - 1 && <ChevronRight className="w-4 h-4 text-neutral-600" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-300 tracking-wider">SYSTEM STATUS</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Memory Usage</span>
                    <span className="text-white font-mono">34%</span>
                  </div>
                  <Progress value={34} className="h-1" />

                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Processing Power</span>
                    <span className="text-white font-mono">67%</span>
                  </div>
                  <Progress value={67} className="h-1" />
                </div>
              </div>

              <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs text-white">SYSTEM ONLINE</span>
                </div>
                <div className="text-xs text-neutral-500 space-y-1">
                  <div>UPTIME: 24:07:15</div>
                  <div>PROCESSED: 1,247 FILES</div>
                  <div>SUCCESS RATE: 99.2%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="text-sm text-neutral-400">
                DATA ANALYTICS / <span className="text-orange-500">{steps[currentStep].name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-neutral-500">LAST UPDATE: {new Date().toLocaleString()}</div>
              <Badge className="bg-white/20 text-white">
                STEP {currentStep + 1} OF {steps.length}
              </Badge>
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-auto">
            {currentStep === 0 && <UploadStep onComplete={handleStepComplete} data={uploadedData} />}
            {currentStep === 1 && (
              <CleanStep onComplete={handleStepComplete} uploadedData={uploadedData} data={cleanedData} />
            )}
            {currentStep === 2 && (
              <AnalyzeStep onComplete={handleStepComplete} cleanedData={cleanedData} data={analysisResults} />
            )}
            {currentStep === 3 && <ExportStep analysisResults={analysisResults} cleanedData={cleanedData} />}
          </div>
        </div>
      </div>
    </div>
  )
}
