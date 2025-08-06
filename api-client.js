// API client for connecting React frontend to Express backend
class DataAnalyticsAPI {
  constructor(baseURL = "http://localhost:3001/api") {
    this.baseURL = baseURL
  }

  async uploadFile(file) {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${this.baseURL}/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    return response.json()
  }

  async cleanData(sessionId, config) {
    const response = await fetch(`${this.baseURL}/clean`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        ...config,
      }),
    })

    if (!response.ok) {
      throw new Error(`Cleaning failed: ${response.statusText}`)
    }

    return response.json()
  }

  async analyzeData(sessionId, analysisConfig) {
    const response = await fetch(`${this.baseURL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        ...analysisConfig,
      }),
    })

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`)
    }

    return response.json()
  }

  async exportData(sessionId, exportConfig) {
    const response = await fetch(`${this.baseURL}/export`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        ...exportConfig,
      }),
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getSession(sessionId) {
    const response = await fetch(`${this.baseURL}/session/${sessionId}`)

    if (!response.ok) {
      throw new Error(`Session fetch failed: ${response.statusText}`)
    }

    return response.json()
  }

  getDownloadUrl(filename) {
    return `${this.baseURL}/download/${filename}`
  }

  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`)
    return response.json()
  }
}

export default DataAnalyticsAPI
