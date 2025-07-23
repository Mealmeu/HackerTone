document.addEventListener("DOMContentLoaded", () => {
  loadDefaultAIs()

  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (!currentUser) {
    window.location.href = "index.html"
    return
  }

  document.getElementById("userName").textContent = currentUser.name || currentUser.email.split("@")[0]

  const navItems = document.querySelectorAll(".nav-item")
  const contentSections = document.querySelectorAll(".content-section")

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetSection = item.dataset.section

      navItems.forEach((nav) => nav.classList.remove("active"))
      contentSections.forEach((section) => section.classList.remove("active"))

      item.classList.add("active")
      document.getElementById(`${targetSection}-section`).classList.add("active")

      if (targetSection === "chat") {
        loadAISelector()
      }
    })
  })

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("currentUser")
    window.location.href = "index.html"
  })

  const createAiBtn = document.getElementById("createAiBtn")
  const createModal = document.getElementById("createModal")
  const closeModal = document.getElementById("closeModal")
  const cancelBtn = document.getElementById("cancelBtn")

  createAiBtn.addEventListener("click", () => {
    createModal.classList.add("active")
    loadPurposeData()
  })

  closeModal.addEventListener("click", () => {
    createModal.classList.remove("active")
  })

  cancelBtn.addEventListener("click", () => {
    createModal.classList.remove("active")
  })

  createModal.addEventListener("click", (e) => {
    if (e.target === createModal) {
      createModal.classList.remove("active")
    }
  })

  const modalTabBtns = document.querySelectorAll(".tab-container .tab-btn")
  const modalTabContents = document.querySelectorAll(".tab-container .tab-content")

  modalTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab

      modalTabBtns.forEach((b) => b.classList.remove("active"))
      modalTabContents.forEach((c) => c.classList.remove("active"))

      btn.classList.add("active")
      document.getElementById(`${targetTab}-tab`).classList.add("active")

      if (targetTab === "prompt") {
        updatePromptPreview()
      }
    })
  })

  function loadPurposeData() {
    const purposeData = [
      {
        name: "학습 도우미",
        prompt:
          "당신은 친근하고 도움이 되는 학습 도우미입니다. 복잡한 개념을 쉽게 설명하고, 학습자의 이해를 돕기 위해 예시와 비유를 사용합니다. {user_input}",
        checked: true,
      },
      {
        name: "창작 도우미",
        prompt:
          "당신은 창의적이고 영감을 주는 창작 도우미입니다. 아이디어 발굴, 스토리텔링, 그리고 창작 과정에서 도움을 제공합니다. {user_input}",
        checked: false,
      },
      {
        name: "업무 도우미",
        prompt:
          "당신은 효율적이고 체계적인 업무 도우미입니다. 업무 계획, 문서 작성, 그리고 생산성 향상을 위한 조언을 제공합니다. {user_input}",
        checked: false,
      },
      {
        name: "상담사",
        prompt:
          "당신은 공감적이고 이해심 많은 상담사입니다. 경청하고, 격려하며, 건설적인 조언을 제공합니다. {user_input}",
        checked: false,
      },
    ]

    const purposeGrid = document.getElementById("purposeGrid")
    purposeGrid.innerHTML = ""

    purposeData.forEach((purpose, index) => {
      const purposeItem = document.createElement("div")
      purposeItem.className = `purpose-item ${purpose.checked ? "selected" : ""}`
      purposeItem.innerHTML = `
                <input type="checkbox" id="purpose-${index}" ${purpose.checked ? "checked" : ""}>
                <h4>${purpose.name}</h4>
                <p>${purpose.prompt.substring(0, 50)}...</p>
            `

      purposeItem.addEventListener("click", () => {
        const checkbox = purposeItem.querySelector('input[type="checkbox"]')
        checkbox.checked = !checkbox.checked
        purposeItem.classList.toggle("selected", checkbox.checked)
      })

      purposeGrid.appendChild(purposeItem)
    })
  }

  function updatePromptPreview() {
    const selectedPurposes = []
    const selectedPersonalities = []

    document.querySelectorAll('.purpose-item input[type="checkbox"]:checked').forEach((checkbox) => {
      const purposeItem = checkbox.closest(".purpose-item")
      selectedPurposes.push(purposeItem.querySelector("h4").textContent)
    })

    document.querySelectorAll('.personality-item input[type="checkbox"]:checked').forEach((checkbox) => {
      selectedPersonalities.push(checkbox.value)
    })

    let prompt = "당신은 "

    if (selectedPersonalities.length > 0) {
      prompt += selectedPersonalities.join(", ") + "한 성격을 가진 "
    }

    if (selectedPurposes.length > 0) {
      prompt += selectedPurposes.join(", ") + " 역할을 하는 "
    }

    prompt += "AI 어시스턴트입니다. 사용자의 질문에 도움이 되고 정확한 답변을 제공해주세요. {user_input}"

    document.getElementById("promptPreview").textContent = prompt
  }

  document.querySelectorAll(".personality-item").forEach((item) => {
    item.addEventListener("click", () => {
      const checkbox = item.querySelector('input[type="checkbox"]')
      checkbox.checked = !checkbox.checked

      if (checkbox.checked) {
        item.style.borderColor = "#667eea"
        item.style.background = "#2d4a4a"
      } else {
        item.style.borderColor = "#4a5568"
        item.style.background = "#1a1a2e"
      }
    })
  })

  document.getElementById("saveAiBtn").addEventListener("click", () => {
    const aiName = document.getElementById("aiName").value

    if (!aiName.trim()) {
      alert("AI 이름을 입력해주세요.")
      return
    }

    const selectedPurposes = []
    const selectedPersonalities = []

    document.querySelectorAll('.purpose-item input[type="checkbox"]:checked').forEach((checkbox) => {
      const purposeItem = checkbox.closest(".purpose-item")
      selectedPurposes.push(purposeItem.querySelector("h4").textContent)
    })

    document.querySelectorAll('.personality-item input[type="checkbox"]:checked').forEach((checkbox) => {
      selectedPersonalities.push(checkbox.value)
    })

    const aiData = {
      id: Date.now(),
      name: aiName,
      purposes: selectedPurposes,
      personalities: selectedPersonalities,
      prompt: document.getElementById("promptPreview").textContent,
      model: "llama3",
      template: document.getElementById("promptPreview").textContent,
      createdAt: new Date().toISOString(),
    }

    const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
    savedAIs.push(aiData)
    localStorage.setItem("savedAIs", JSON.stringify(savedAIs))

    saveAIToFile(aiData)

    showSuccessMessage("AI가 성공적으로 생성되었습니다!")

    createModal.classList.remove("active")

    loadSavedAIs()
  })

  function saveAIToFile(aiData) {
    const aiFileData = {
      name: aiData.name,
      model: aiData.model,
      template: aiData.template,
    }

    const dataStr = JSON.stringify(aiFileData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `ais/${aiData.name}.json`
    link.click()

    URL.revokeObjectURL(link.href)
  }

  document.getElementById("loadJsonBtn").addEventListener("click", () => {
    document.getElementById("jsonFileInput").click()
  })

  document.getElementById("jsonFileInput").addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result)

          const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
          if (Array.isArray(jsonData)) {
            jsonData.forEach((ai) => {
              const aiData = {
                id: Date.now() + Math.random(),
                name: ai.name,
                purposes: ai.purposes || [],
                personalities: ai.personalities || [],
                prompt: ai.template || ai.prompt,
                model: ai.model || "llama3.2",
                template: ai.template || ai.prompt,
                createdAt: new Date().toISOString(),
              }
              savedAIs.push(aiData)
            })
          } else {
            const aiData = {
              id: Date.now(),
              name: jsonData.name,
              purposes: jsonData.purposes || [],
              personalities: jsonData.personalities || [],
              prompt: jsonData.template || jsonData.prompt,
              model: jsonData.model || "llama3.2",
              template: jsonData.template || jsonData.prompt,
              createdAt: new Date().toISOString(),
            }
            savedAIs.push(aiData)
          }
          localStorage.setItem("savedAIs", JSON.stringify(savedAIs))

          loadSavedAIs()
          showSuccessMessage("JSON 파일이 성공적으로 로드되었습니다!")
        } catch (error) {
          alert("유효하지 않은 JSON 파일입니다.")
        }
      }
      reader.readAsText(file)
    }
  })

  async function loadDefaultAIs() {
    try {
      const response = await fetch("ais/기본AI.json")
      const defaultAIs = await response.json()
      const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
      const hasDefaultAIs = savedAIs.some((ai) => ai.isDefault)

      if (!hasDefaultAIs) {
        defaultAIs.forEach((ai, index) => {
          const aiData = {
            id: Date.now() + index,
            name: ai.name,
            purposes: [],
            personalities: [],
            prompt: ai.template,
            model: ai.model || "llama3.2",
            template: ai.template,
            isDefault: true,
            createdAt: new Date().toISOString(),
          }
          savedAIs.push(aiData)
        })

        localStorage.setItem("savedAIs", JSON.stringify(savedAIs))
        loadSavedAIs()
      }
    } catch (error) {
      console.log("기본 AI 파일을 불러올 수 없습니다:", error)
    }
  }

  function loadSavedAIs() {
    const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
    const aiList = document.getElementById("aiList")

    aiList.innerHTML = ""

    savedAIs.forEach((ai, index) => {
      const aiCard = document.createElement("div")
      aiCard.className = "ai-card"
      aiCard.style.animationDelay = `${index * 0.1}s`

      const defaultBadge = ai.isDefault ? '<span class="default-badge">기본 AI</span>' : ""

      aiCard.innerHTML = `
        <div class="ai-card-header">
          <h3>${ai.name}</h3>
          ${defaultBadge}
        </div>
        <p><strong>모델:</strong> ${ai.model || "llama3.2"}</p>
        <p><strong>용도:</strong> ${ai.purposes ? ai.purposes.join(", ") : "N/A"}</p>
        <p><strong>성격:</strong> ${ai.personalities ? ai.personalities.join(", ") : "N/A"}</p>
        <p><strong>생성일:</strong> ${new Date(ai.createdAt).toLocaleDateString()}</p>
        <div style="margin-top: 15px;">
          <button class="use-ai-btn" onclick="useAI(${ai.id})">사용하기</button>
          ${!ai.isDefault ? `<button class="delete-ai-btn" onclick="deleteAI(${ai.id})">삭제</button>` : ""}
          <button class="download-ai-btn" onclick="downloadAI(${ai.id})">다운로드</button>
        </div>
      `
      aiList.appendChild(aiCard)
    })
  }

  function loadChatHistory() {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]")
    const chatHistoryContainer = document.getElementById("chatHistory")

    chatHistoryContainer.innerHTML = ""

    if (chatHistory.length === 0) {
      chatHistoryContainer.innerHTML = '<p style="text-align: center; color: #b0b0c0;">아직 채팅 기록이 없습니다.</p>'
      return
    }

    chatHistory.forEach((chat, index) => {
      const chatItem = document.createElement("div")
      chatItem.className = "chat-item"
      chatItem.style.animationDelay = `${index * 0.1}s`
      chatItem.innerHTML = `
                <h4>${chat.aiName || "AI 어시스턴트"}</h4>
                <p><strong>마지막 메시지:</strong> ${chat.lastMessage.substring(0, 100)}...</p>
                <p><strong>날짜:</strong> ${new Date(chat.timestamp).toLocaleString()}</p>
                <button onclick="viewChatDetail(${chat.id})">자세히 보기</button>
            `
      chatHistoryContainer.appendChild(chatItem)
    })
  }

  function loadAISelector() {
    const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
    const aiSelector = document.getElementById("aiSelector")

    aiSelector.innerHTML = '<option value="">AI를 선택하세요</option>'

    savedAIs.forEach((ai) => {
      const option = document.createElement("option")
      option.value = ai.id
      option.textContent = ai.name
      aiSelector.appendChild(option)
    })
  }

  window.useAI = (aiId) => {
    const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
    const ai = savedAIs.find((a) => a.id === aiId)
    if (ai) {
      document.getElementById("aiSelector").value = aiId
      navItems.forEach((nav) => nav.classList.remove("active"))
      contentSections.forEach((section) => section.classList.remove("active"))
      document.querySelector('[data-section="chat"]').classList.add("active")
      document.getElementById("chat-section").classList.add("active")
      loadAISelector()
      showSuccessMessage(`${ai.name} AI가 선택되었습니다!`)
    }
  }

  window.deleteAI = (aiId) => {
    if (confirm("정말로 이 AI를 삭제하시겠습니까?")) {
      const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
      const filteredAIs = savedAIs.filter((ai) => ai.id !== aiId)
      localStorage.setItem("savedAIs", JSON.stringify(filteredAIs))
      loadSavedAIs()
      showSuccessMessage("AI가 삭제되었습니다.")
    }
  }

  window.downloadAI = (aiId) => {
    const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
    const ai = savedAIs.find((a) => a.id === aiId)
    if (ai) {
      saveAIToFile(ai)
      showSuccessMessage(`${ai.name} AI가 다운로드되었습니다!`)
    }
  }

  window.viewChatDetail = (chatId) => {
    navItems.forEach((nav) => nav.classList.remove("active"))
    contentSections.forEach((section) => section.classList.remove("active"))
    document.querySelector('[data-section="chat"]').classList.add("active")
    document.getElementById("chat-section").classList.add("active")

    if (window.aiChatManager) {
      window.aiChatManager.loadChatHistory(chatId)
    }
  }

  function showSuccessMessage(message) {
    const successDiv = document.createElement("div")
    successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(72, 187, 120, 0.3);
            z-index: 10000;
            animation: slideInRight 0.5s ease-out;
        `
    successDiv.textContent = message

    document.body.appendChild(successDiv)

    setTimeout(() => {
      successDiv.style.animation = "slideOutRight 0.5s ease-in"
      setTimeout(() => successDiv.remove(), 500)
    }, 3000)
  }

  loadSavedAIs()
  loadChatHistory()

  const chatInput = document.getElementById("chatInput")
  const sendBtn = document.getElementById("sendBtn")
  const chatMessages = document.getElementById("chatMessages")
  const aiSelector = document.getElementById("aiSelector")
  const modelSelector = document.getElementById("modelSelector")

  let currentChatId = null
  let isAIResponding = false

  sendBtn.addEventListener("click", sendMessage)
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })

  async function sendMessage() {
    const message = chatInput.value.trim()
    const selectedAIId = aiSelector.value
    const selectedModel = modelSelector.value

    if (!message || !selectedAIId || isAIResponding) return

    const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
    const selectedAI = savedAIs.find((ai) => ai.id == selectedAIId)

    if (!selectedAI) {
      alert("AI를 선택해주세요.")
      return
    }

    addMessage(message, "user")
    chatInput.value = ""

    const loadingMessage = addMessage("", "loading")
    isAIResponding = true
    sendBtn.disabled = true

    try {
      const aiPrompt = selectedAI.template.replace("{user_input}", message)
      const response = await callOllamaAPI(aiPrompt, selectedModel)

      loadingMessage.remove()

      addMessage(response, "ai")
      saveChatHistory(selectedAI.name, message, response)
    } catch (error) {
      loadingMessage.remove()
      addMessage("죄송합니다. 오류가 발생했습니다: " + error.message, "ai")
    } finally {
      isAIResponding = false
      sendBtn.disabled = false
    }
  }

  function addMessage(content, type) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${type}`

    if (type === "loading") {
      messageDiv.innerHTML = `
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `
    } else {
      messageDiv.textContent = content
    }

    chatMessages.appendChild(messageDiv)
    chatMessages.scrollTop = chatMessages.scrollHeight

    return messageDiv
  }

  async function callOllamaAPI(prompt, model) {
    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.response || "응답을 받을 수 없습니다."
    } catch (error) {
      if (error.message.includes("Failed to fetch")) {
        throw new Error("Ollama 서버에 연결할 수 없습니다. Ollama가 실행 중인지 확인해주세요.")
      }
      throw error
    }
  }

  function saveChatHistory(aiName, userMessage, aiResponse) {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]")

    if (!currentChatId) {
      currentChatId = Date.now()
    }

    let existingChat = chatHistory.find((chat) => chat.id === currentChatId)

    if (!existingChat) {
      existingChat = {
        id: currentChatId,
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

  aiSelector.addEventListener("change", () => {
    currentChatId = null
    chatMessages.innerHTML = ""

    if (aiSelector.value) {
      const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
      const selectedAI = savedAIs.find((ai) => ai.id == aiSelector.value)
      if (selectedAI) {
        addMessage(`안녕하세요! ${selectedAI.name}입니다. 무엇을 도와드릴까요?`, "ai")
      }
    }
  })
})
