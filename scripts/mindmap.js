class MindmapManager {
  constructor() {
    this.initializeEventListeners()
  }

  initializeEventListeners() {
    const initBtn = document.getElementById("initMindmapBtn")
    const generateBtn = document.getElementById("generateMindmapBtn")

    if (initBtn) {
      initBtn.addEventListener("click", () => this.initMindmap())
    }

    if (generateBtn) {
      generateBtn.addEventListener("click", () => this.generateMindmap())
    }
  }

  initMindmap() {
    const mindmapDisplay = document.getElementById("mindmapDisplay")
    const topicInput = document.getElementById("mindmapTopic")

    mindmapDisplay.innerHTML = "<p>마인드맵이 여기에 표시됩니다</p>"
    topicInput.value = ""

    this.hideRecommendation()
  }

  async generateMindmap() {
    const topicInput = document.getElementById("mindmapTopic")
    const mindmapDisplay = document.getElementById("mindmapDisplay")

    const topic = topicInput.value.trim()

    if (!topic) {
      alert("주제를 입력해주세요.")
      return
    }

    mindmapDisplay.innerHTML = '<div class="mindmap-loading">마인드맵 생성 중...</div>'

    try {
      const mindmapData = await this.callMindmapAPI(topic)
      this.displayMindmap(mindmapData, topic)
      this.showAIRecommendation()
    } catch (error) {
      mindmapDisplay.innerHTML = `<p style="color: #ff6b6b;">오류가 발생했습니다: ${error.message}</p>`
    }
  }

  async callMindmapAPI(topic) {
    const prompt = `다음 주제에 대한 마인드맵을 생성해주세요: "${topic}"

마인드맵은 다음 형식으로 작성해주세요:
- 중심 주제를 기준으로 주요 카테고리들을 나열
- 각 카테고리 아래에 세부 항목들을 포함
- 계층 구조를 명확하게 표현
- 간결하고 핵심적인 키워드 위주로 작성

형식:
중심주제: ${topic}
├── 주요카테고리1
│   ├── 세부항목1-1
│   ├── 세부항목1-2
│   └── 세부항목1-3
├── 주요카테고리2
│   ├── 세부항목2-1
│   └── 세부항목2-2
└── 주요카테고리3
    ├── 세부항목3-1
    └── 세부항목3-2`

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3",
          prompt: prompt,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.response || "마인드맵을 생성할 수 없습니다."
    } catch (error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error("Ollama 서버에 연결할 수 없습니다. Ollama가 실행 중인지 확인해주세요.")
      }
      throw error
    }
  }

  displayMindmap(mindmapData, topic) {
    const mindmapDisplay = document.getElementById("mindmapDisplay")

    const mindmapContainer = document.createElement("div")
    mindmapContainer.className = "mindmap-content"

    const mindmapText = document.createElement("pre")
    mindmapText.className = "mindmap-text"
    mindmapText.textContent = mindmapData

    mindmapContainer.appendChild(mindmapText)

    mindmapDisplay.innerHTML = ""
    mindmapDisplay.appendChild(mindmapContainer)
  }

  showAIRecommendation() {
    const mindmapDisplay = document.getElementById("mindmapDisplay")

    const recommendationDiv = document.createElement("div")
    recommendationDiv.className = "ai-recommendation"
    recommendationDiv.innerHTML = `
      <div class="recommendation-content">
        <span class="recommendation-text">이런 거 추가해보는 거 어때요?</span>
        <button class="recommendation-btn" onclick="mindmapManager.addRecommendation()">
          💡 AI 추천 받기
        </button>
      </div>
    `

    mindmapDisplay.appendChild(recommendationDiv)
  }

  async addRecommendation() {
    const topicInput = document.getElementById("mindmapTopic")
    const topic = topicInput.value.trim()

    if (!topic) return

    const recommendationBtn = document.querySelector(".recommendation-btn")
    const originalText = recommendationBtn.innerHTML
    recommendationBtn.innerHTML = "생각 중..."
    recommendationBtn.disabled = true

    try {
      const recommendation = await this.getAIRecommendation(topic)
      this.displayRecommendation(recommendation)
    } catch (error) {
      alert("추천을 가져오는 중 오류가 발생했습니다: " + error.message)
    } finally {
      recommendationBtn.innerHTML = originalText
      recommendationBtn.disabled = false
    }
  }

  async getAIRecommendation(topic) {
    const prompt = `"${topic}" 주제의 마인드맵에 추가하면 좋을 만한 창의적이고 유용한 아이디어 3가지를 간단히 제안해주세요. 각각 한 줄로 작성해주세요.`

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3",
          prompt: prompt,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.response || "추천을 생성할 수 없습니다."
    } catch (error) {
      throw error
    }
  }

  displayRecommendation(recommendation) {
    const mindmapDisplay = document.getElementById("mindmapDisplay")

    let recommendationDisplay = document.querySelector(".recommendation-display")

    if (!recommendationDisplay) {
      recommendationDisplay = document.createElement("div")
      recommendationDisplay.className = "recommendation-display"
      mindmapDisplay.appendChild(recommendationDisplay)
    }

    recommendationDisplay.innerHTML = `
      <div class="recommendation-box">
        <h4>💡 AI 추천 아이디어</h4>
        <div class="recommendation-content-text">${recommendation}</div>
        <button class="close-recommendation" onclick="mindmapManager.hideRecommendation()">×</button>
      </div>
    `
  }

  hideRecommendation() {
    const recommendationDisplay = document.querySelector(".recommendation-display")
    const aiRecommendation = document.querySelector(".ai-recommendation")

    if (recommendationDisplay) {
      recommendationDisplay.remove()
    }

    if (aiRecommendation) {
      aiRecommendation.remove()
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.mindmapManager = new MindmapManager()
})
