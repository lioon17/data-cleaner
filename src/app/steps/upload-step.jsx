"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { inferTypes } from "@utils/infer"



import { Upload, FileText, Database, CheckCircle } from "lucide-react"

export default function UploadStep({ onComplete, data }) {
  const [dragActive, setDragActive] = useState(false)
 const [uploadedFile, setUploadedFile] = useState(null)
const [fileData, setFileData] = useState(null)
const [fieldTypes, setFieldTypes] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file) => {
    setIsProcessing(true)
    setUploadedFile(file)

   try {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await res.json();

 if (res.ok) {
  localStorage.setItem('sessionId', result.sessionId);  // ✅ Store in DevTools-visible storage
  console.log('✅ Session ID:', result.sessionId);       // ✅ Log for debug

  setFileData(result.preview);
const inferred = inferTypes(result.preview[0])
setFieldTypes(inferred)


  setIsProcessing(false);

  onComplete({
    file,
    parsedData: result.preview,
    fieldTypes: inferred, // ✅ reuse the one already inferred
    sessionId: result.sessionId,
  });
} else {
    throw new Error(result.error || 'Upload failed');
  }
} catch (err) {
  console.error(err);
  alert('❌ Upload failed.');
  setIsProcessing(false);
}

     
  }

 
  const getTypeColor = (type) => {
    switch (type) {
      case "string":
        return "bg-blue-500/20 text-blue-400"
      case "integer":
      case "number":
        return "bg-white/20 text-white"
      case "email":
        return "bg-purple-500/20 text-purple-400"
      case "boolean":
        return "bg-orange-500/20 text-orange-400"
      case "datetime":
        return "bg-cyan-500/20 text-cyan-400"
      case "category":
        return "bg-yellow-500/20 text-yellow-400"
      case "array":
        return "bg-pink-500/20 text-pink-400"
      default:
        return "bg-neutral-500/20 text-neutral-400"
    }
  }

  const handleContinue = () => {
    onComplete({
      file: uploadedFile,
      parsedData: fileData,
      fieldTypes: fieldTypes,
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">DATA UPLOAD</h1>
          <p className="text-sm text-neutral-400">Import your CSV or JSON files for processing</p>
        </div>
      </div>

      {!uploadedFile ? (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? "border-orange-500 bg-orange-500/10" : "border-neutral-600 hover:border-neutral-500"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Drop your files here</h3>
              <p className="text-neutral-400 mb-6">Supports CSV and JSON files up to 100MB</p>
              <div className="space-y-4">
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <input id="file-input" type="file" accept=".csv,.json" onChange={handleFileInput} className="hidden" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* File Info */}
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">UPLOADED FILE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-orange-500" />
                <div className="flex-1">
                  <h3 className="text-white font-medium">{uploadedFile.name}</h3>
                  <p className="text-sm text-neutral-400">
                    {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type || "Unknown type"}
                  </p>
                </div>
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-orange-500">Processing...</span>
                  </div>
                ) : (
                  <CheckCircle className="w-6 h-6 text-white" />
                )}
              </div>
            </CardContent>
          </Card>

          {fileData && fieldTypes && (
            <>
              {/* Field Types */}
              <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                    DETECTED FIELD TYPES
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(fieldTypes).map(([field, info]) => (
                      <div key={field} className="p-3 bg-neutral-800 rounded border border-neutral-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white font-mono">{field}</span>
                          <Badge className={getTypeColor(info.type)}>{info.type.toUpperCase()}</Badge>
                        </div>
                        <div className="flex gap-2 text-xs">
                          {info.nullable && <Badge className="bg-neutral-700 text-neutral-300">NULLABLE</Badge>}
                          {info.unique && <Badge className="bg-neutral-700 text-neutral-300">UNIQUE</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Data Preview */}
              <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                    DATA PREVIEW ({fileData.length} rows)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-700">
                          {Object.keys(fileData[0] || {}).map((header) => (
                            <th key={header} className="text-left py-2 px-3 text-neutral-300 font-medium font-mono">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileData.slice(0, 5).map((row, index) => (
                          <tr key={index} className="border-b border-neutral-800">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="py-2 px-3 text-neutral-300 font-mono">
                                {value === null || value === undefined ? (
                                  <span className="text-red-400 italic">null</span>
                                ) : value === "" ? (
                                  <span className="text-orange-400 italic">empty</span>
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
                  {fileData.length > 5 && (
                    <div className="mt-4 text-center">
                      <span className="text-xs text-neutral-500">
                        Showing first 5 rows of {fileData.length} total rows
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Continue Button */}
              <div className="flex justify-end">
                <Button onClick={handleContinue} disabled={isProcessing} className="bg-orange-500 hover:bg-orange-600 text-white">
                  Continue to Cleaning
                  <Database className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
