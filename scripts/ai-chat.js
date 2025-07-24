class AIChatManager {
  constructor() {
    this.currentChatId = null
    this.isAIResponding = false

    this.chatInput = document.getElementById("chatInput")
    this.sendBtn = document.getElementById("sendBtn")
    this.aiSelector = document.getElementById("aiSelector")
    this.modelSelector = document.getElementById("modelSelector")
    this.chatMessages = document.getElementById("chatMessages")

    this.initializeEventListeners()
  }

  initializeEventListeners() {
    const chatInput = document.getElementById("chatInput")
    const sendBtn = document.getElementById("sendBtn")
    const aiSelector = document.getElementById("aiSelector")

    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.sendMessage())
    }

    if (chatInput) {
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          this.sendMessage()
        }
      })
    }

    if (aiSelector) {
      aiSelector.addEventListener("change", () => this.onAISelectionChange())
    }
  }

  async sendMessage() {
    const chatInput = document.getElementById("chatInput")
    const aiSelector = document.getElementById("aiSelector")
    const modelSelector = document.getElementById("modelSelector")
    const sendBtn = document.getElementById("sendBtn")

    const message = chatInput.value.trim()
    const selectedAIId = aiSelector.value
    const selectedModel = modelSelector.value

    if (!message || !selectedAIId || this.isAIResponding) return

    const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
    const selectedAI = savedAIs.find((ai) => ai.id == selectedAIId)

    if (!selectedAI) {
      this.showError("AI를 선택해주세요.")
      return
    }

    this.addMessage(message, "user")
    chatInput.value = ""

    const loadingMessage = this.addLoadingMessage()
    this.isAIResponding = true
    sendBtn.disabled = true

    try {
      const aiPrompt = this.getPersonalizedPrompt(selectedAI.template, message)
      const response = await this.callOllamaAPI(aiPrompt, selectedModel)

      loadingMessage.remove()
      this.addMessage(response, "ai")
      this.saveChatHistory(selectedAI.name, message, response)
    } catch (error) {
      loadingMessage.remove()
      this.addMessage("죄송합니다. 오류가 발생했습니다: " + error.message, "ai")
    } finally {
      this.isAIResponding = false
      sendBtn.disabled = false
    }
  }

  getPersonalizedPrompt(basePrompt, userInput) {
    const userMemory = JSON.parse(localStorage.getItem("userMemory") || "{}")

    if (!userMemory.mainInterests || userMemory.mainInterests.length === 0) {
      return basePrompt.replace("{user_input}", userInput)
    }

    const personalizedContext = `
사용자 정보:
- 주요 관심사: ${userMemory.mainInterests.join(", ")}
- 선호 AI: ${userMemory.favoriteAI || "없음"}
- 대화 스타일: ${
      userMemory.conversationStyle
        ? `평균 ${userMemory.conversationStyle.avgMessageLength}자 메시지, 질문 비율 ${userMemory.conversationStyle.questionRatio}%`
        : "분석 중"
    }

위 정보를 참고하여 사용자에게 맞춤형 답변을 제공해주세요.
`

    return personalizedContext + "\n\n" + basePrompt.replace("{user_input}", userInput)
  }

  addMessage(content, type) {
    const chatMessages = document.getElementById("chatMessages")
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${type}`
    messageDiv.textContent = content

    chatMessages.appendChild(messageDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight

    return messageDiv
  }

  addLoadingMessage() {
    const chatMessages = document.getElementById("chatMessages")
    const messageDiv = document.createElement("div")
    messageDiv.className = "message loading"
    messageDiv.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `

    chatMessages.appendChild(messageDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight

    return messageDiv
  }

  async callOllamaAPI(prompt, model) {
    const actualModel = model === "deepseek" ? "deepseek-r1:14b" : model

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: actualModel,
          prompt: prompt,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()

      if (!data.response) {
        throw new Error("응답에 데이터가 없습니다.")
      }

      return data.response
    } catch (error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error("Ollama 서버에 연결할 수 없습니다. Ollama가 실행 중인지, CORS 문제가 없는지 확인해주세요.")
      }

      throw error
    }
  }

  saveChatHistory(aiName, userMessage, aiResponse) {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]")

    if (!this.currentChatId) {
      this.currentChatId = Date.now()
    }

    let existingChat = chatHistory.find((chat) => chat.id === this.currentChatId)

    if (!existingChat) {
      existingChat = {
        id: this.currentChatId,
        aiName: aiName,
        messages: [],
        timestamp: new Date().toISOString(),
        lastMessage: userMessage,
      }
      chatHistory.push(existingChat)
    }

    existingChat.messages.push(
      { type: "user", content: userMessage, timestamp: new Date().toISOString() },
      { type: "ai", content: aiResponse, timestamp: new Date().toISOString() },
    )

    existingChat.lastMessage = userMessage
    existingChat.timestamp = new Date().toISOString()

    localStorage.setItem("chatHistory", JSON.stringify(chatHistory))
  }

  onAISelectionChange() {
    const aiSelector = document.getElementById("aiSelector")
    const chatMessages = document.getElementById("chatMessages")

    this.currentChatId = null
    chatMessages.innerHTML = ""

    if (aiSelector.value) {
      const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
      const selectedAI = savedAIs.find((ai) => ai.id == aiSelector.value)
      if (selectedAI) {
        this.addMessage(`안녕하세요! ${selectedAI.name}입니다. 무엇을 도와드릴까요?`, "ai")
      }
    }
  }

  showError(message) {
    alert(message)
  }

  loadChatHistory(chatId) {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]")
    const chat = chatHistory.find((c) => c.id === chatId)

    if (chat) {
      const chatMessages = document.getElementById("chatMessages")
      chatMessages.innerHTML = ""

      chat.messages.forEach((msg) => {
        this.addMessage(msg.content, msg.type)
      })

      this.currentChatId = chatId
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.aiChatManager = new AIChatManager()
})
