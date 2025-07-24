class FileSystemManager {
  constructor() {
    this.fileHandle = null
    this.hasPermission = false
    this.initializeFileSystem()
  }

  async initializeFileSystem() {
    if ("showDirectoryPicker" in window) {
      this.updatePermissionStatus()
    } else {
      console.warn("File System Access API가 지원되지 않습니다.")
    }
  }

  async requestFilePermission() {
    try {
      if (!("showDirectoryPicker" in window)) {
        throw new Error("File System Access API가 지원되지 않는 브라우저입니다.")
      }

      const dirHandle = await window.showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents",
      })

      this.directoryHandle = dirHandle
      this.hasPermission = true

      this.updatePermissionStatus()

      await this.createTestFile()

      return true
    } catch (error) {
      console.error("파일 권한 요청 실패:", error)
      this.showError("파일 시스템 권한을 얻을 수 없습니다: " + error.message)
      return false
    }
  }

  async createTestFile() {
    try {
      const testFileHandle = await this.directoryHandle.getFileHandle("prime-test.txt", {
        create: true,
      })

      const writable = await testFileHandle.createWritable()
      await writable.write("PRIME 파일 시스템 테스트 - " + new Date().toISOString())
      await writable.close()

      console.log("테스트 파일 생성 완료")
    } catch (error) {
      console.error("테스트 파일 생성 실패:", error)
    }
  }

  async saveAIFile(aiData) {
    if (!this.hasPermission || !this.directoryHandle) {
      return this.downloadAIFile(aiData)
    }

    try {
      let aisDir
      try {
        aisDir = await this.directoryHandle.getDirectoryHandle("ais")
      } catch {
        aisDir = await this.directoryHandle.getDirectoryHandle("ais", { create: true })
      }

      const fileName = `${aiData.name.replace(/[^a-zA-Z0-9가-힣]/g, "_")}.json`
      const fileHandle = await aisDir.getFileHandle(fileName, { create: true })

      const writable = await fileHandle.createWritable()
      await writable.write(JSON.stringify(aiData, null, 2))
      await writable.close()

      console.log(`AI 파일 저장 완료: ais/${fileName}`)
      return `ais/${fileName}`
    } catch (error) {
      console.error("AI 파일 저장 실패:", error)
      return this.downloadAIFile(aiData)
    }
  }

  downloadAIFile(aiData) {
    const aiFileData = {
      name: aiData.name,
      model: aiData.model,
      template: aiData.template,
      purposes: aiData.purposes,
      personalities: aiData.personalities,
      createdAt: aiData.createdAt,
    }

    const dataStr = JSON.stringify(aiFileData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `${aiData.name.replace(/[^a-zA-Z0-9가-힣]/g, "_")}.json`
    link.click()

    URL.revokeObjectURL(link.href)
    return `downloads/${link.download}`
  }

  async modifyFile(filePath, content) {
    if (!this.hasPermission || !this.directoryHandle) {
      throw new Error("파일 수정 권한이 없습니다.")
    }

    try {
      const pathParts = filePath.split("/")
      let currentDir = this.directoryHandle

      for (let i = 0; i < pathParts.length - 1; i++) {
        currentDir = await currentDir.getDirectoryHandle(pathParts[i])
      }

      const fileName = pathParts[pathParts.length - 1]
      const fileHandle = await currentDir.getFileHandle(fileName, { create: true })

      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      console.log(`파일 수정 완료: ${filePath}`)
      return true
    } catch (error) {
      console.error("파일 수정 실패:", error)
      throw error
    }
  }

  async readFile(filePath) {
    if (!this.hasPermission || !this.directoryHandle) {
      throw new Error("파일 읽기 권한이 없습니다.")
    }

    try {
      const pathParts = filePath.split("/")
      let currentDir = this.directoryHandle

      for (let i = 0; i < pathParts.length - 1; i++) {
        currentDir = await currentDir.getDirectoryHandle(pathParts[i])
      }

      const fileName = pathParts[pathParts.length - 1]
      const fileHandle = await currentDir.getFileHandle(fileName)
      const file = await fileHandle.getFile()

      return await file.text()
    } catch (error) {
      console.error("파일 읽기 실패:", error)
      throw error
    }
  }

  updatePermissionStatus() {
    const statusElement = document.getElementById("filePermissionStatus")
    if (!statusElement) return

    if (this.hasPermission) {
      statusElement.innerHTML = `
        <span class="status-indicator granted">✅</span>
        <span>권한 허용됨</span>
      `
    } else {
      statusElement.innerHTML = `
        <span class="status-indicator denied">❌</span>
        <span>권한 없음</span>
      `
    }
  }

  showError(message) {
    const errorDiv = document.createElement("div")
    errorDiv.className = "error-notification"
    errorDiv.textContent = message
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4757;
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(255, 71, 87, 0.3);
      z-index: 10000;
      animation: slideInRight 0.5s ease-out;
    `

    document.body.appendChild(errorDiv)

    setTimeout(() => {
      errorDiv.style.animation = "slideOutRight 0.5s ease-in"
      setTimeout(() => errorDiv.remove(), 500)
    }, 5000)
  }

  async aiModifyFile(filePath, content, userConfirmation = false) {
    if (!userConfirmation) {
      const confirmed = confirm(`AI가 다음 파일을 수정하려고 합니다:\n${filePath}\n\n허용하시겠습니까?`)
      if (!confirmed) {
        throw new Error("사용자가 파일 수정을 거부했습니다.")
      }
    }

    if (filePath.includes("..") || filePath.startsWith("/")) {
      throw new Error("안전하지 않은 파일 경로입니다.")
    }

    return await this.modifyFile(filePath, content)
  }
}

window.fileSystemManager = new FileSystemManager()

document.addEventListener("DOMContentLoaded", () => {
  const requestPermissionBtn = document.getElementById("requestFilePermission")
  if (requestPermissionBtn) {
    requestPermissionBtn.addEventListener("click", async () => {
      const success = await window.fileSystemManager.requestFilePermission()
      if (success) {
        alert("파일 시스템 권한이 허용되었습니다!")
      }
    })
  }
})
