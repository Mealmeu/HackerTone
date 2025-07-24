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
      } else if (targetSection === "settings") {
        loadSystemInfo()
      } else if (targetSection === "memory") {
        loadMemoryData()
      } else if (targetSection === "history") {
        loadChatHistory()
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
    updateStorageInfo()
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
        updatePromptEditor()
      } else if (targetTab === "storage") {
        updateStorageInfo()
      }
    })
  })

  const resetPromptBtn = document.getElementById("resetPrompt")
  const previewPromptBtn = document.getElementById("previewPrompt")
  const promptEditor = document.getElementById("promptEditor")

  if (resetPromptBtn) {
    resetPromptBtn.addEventListener("click", () => {
      const defaultPrompt = generateDefaultPrompt()
      promptEditor.value = defaultPrompt
    })
  }

  if (previewPromptBtn) {
    previewPromptBtn.addEventListener("click", () => {
      const prompt = promptEditor.value
      const previewWindow = window.open("", "_blank", "width=600,height=400")
      previewWindow.document.write(`
        <html>
          <head><title>프롬프트 미리보기</title></head>
          <body style="font-family: monospace; padding: 20px; background: #2a2a2a; color: white;">
            <h2>프롬프트 미리보기</h2>
            <pre style="white-space: pre-wrap; background: #1a1a1a; padding: 15px; border-radius: 8px;">${prompt}</pre>
          </body>
        </html>
      `)
    })
  }

  async function loadPurposeData() {
    try {
      const response = await fetch("data/ai-purposes.json")
      const purposes = await response.json()

      const purposeGrid = document.getElementById("purposeGrid")
      purposeGrid.innerHTML = ""

      purposes.forEach((purpose, index) => {
        const purposeItem = document.createElement("div")
        purposeItem.className = "purpose-item"
        purposeItem.dataset.purposeId = purpose.id

        purposeItem.innerHTML = `
          <input type="checkbox" id="purpose-${index}">
          <div class="purpose-icon">${purpose.icon}</div>
          <h4>${purpose.name}</h4>
          <p>${purpose.description}</p>
        `

        purposeItem.addEventListener("click", () => {
          const checkbox = purposeItem.querySelector('input[type="checkbox"]')
          checkbox.checked = !checkbox.checked
          purposeItem.classList.toggle("selected", checkbox.checked)
          updatePromptEditor()
        })

        purposeGrid.appendChild(purposeItem)
      })
    } catch (error) {
      console.error("AI 용도 데이터 로드 실패:", error)
    }
  }

  async function generateDefaultPrompt() {
    const selectedPurposes = []
    const selectedPersonalities = []

    // 선택된 용도 가져오기
    const selectedPurposeElements = document.querySelectorAll('.purpose-item input[type="checkbox"]:checked')

    if (selectedPurposeElements.length > 0) {
      try {
        const response = await fetch("data/ai-purposes.json")
        const purposes = await response.json()

        selectedPurposeElements.forEach((checkbox) => {
          const purposeItem = checkbox.closest(".purpose-item")
          const purposeId = purposeItem.dataset.purposeId
          const purpose = purposes.find((p) => p.id === purposeId)
          if (purpose) {
            selectedPurposes.push(purpose)
          }
        })
      } catch (error) {
        console.error("용도 데이터 로드 실패:", error)
      }
    }

    document.querySelectorAll('.personality-item input[type="checkbox"]:checked').forEach((checkbox) => {
      selectedPersonalities.push(checkbox.value)
    })

    // 첫 번째 선택된 용도의 프롬프트 사용
    if (selectedPurposes.length > 0) {
      let prompt = selectedPurposes[0].prompt

      // 성격 정보 추가
      if (selectedPersonalities.length > 0) {
        prompt = prompt.replace("당신은", `당신은 ${selectedPersonalities.join(", ")}한 성격을 가진`)
      }

      return prompt
    }

    // 기본 프롬프트
    let prompt = "당신은 "

    if (selectedPersonalities.length > 0) {
      prompt += selectedPersonalities.join(", ") + "한 성격을 가진 "
    }

    prompt +=
      "AI 어시스턴트입니다. 사용자의 질문에 도움이 되고 정확한 답변을 제공해주세요.\n\n사용자 입력: {user_input}"

    return prompt
  }

  async function updatePromptEditor() {
    const promptEditor = document.getElementById("promptEditor")
    if (promptEditor && !promptEditor.value) {
      const defaultPrompt = await generateDefaultPrompt()
      promptEditor.value = defaultPrompt
    }
  }

  function updateStorageInfo() {
    const aiName = document.getElementById("aiName").value || "새로운_AI"
    const aiFilePath = document.getElementById("aiFilePath")
    const formatPreview = document.getElementById("formatPreview")

    if (aiFilePath) {
      aiFilePath.textContent = `ais/${aiName.replace(/[^a-zA-Z0-9가-힣]/g, "_")}.json`
    }

    if (formatPreview) {
      const selectedPurposes = Array.from(
        document.querySelectorAll('.purpose-item input[type="checkbox"]:checked'),
      ).map((cb) => cb.closest(".purpose-item").querySelector("h4").textContent)

      const selectedPersonalities = Array.from(
        document.querySelectorAll('.personality-item input[type="checkbox"]:checked'),
      ).map((cb) => cb.value)

      const sampleData = {
        name: aiName,
        model: "llama3",
        template: document.getElementById("promptEditor")?.value || "프롬프트 내용",
        purposes: selectedPurposes,
        personalities: selectedPersonalities,
        createdAt: new Date().toISOString(),
      }

      formatPreview.textContent = JSON.stringify(sampleData, null, 2)
    }
  }

  const aiNameInput = document.getElementById("aiName")
  if (aiNameInput) {
    aiNameInput.addEventListener("input", updateStorageInfo)
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

      updatePromptEditor()
      updateStorageInfo()
    })
  })

  document.getElementById("saveAiBtn").addEventListener("click", async () => {
    const aiName = document.getElementById("aiName").value
    const promptEditor = document.getElementById("promptEditor")

    if (!aiName.trim()) {
      alert("AI 이름을 입력해주세요.")
      return
    }

    if (!promptEditor.value.trim()) {
      alert("프롬프트를 입력해주세요.")
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
      prompt: promptEditor.value,
      model: "llama3",
      template: promptEditor.value,
      createdAt: new Date().toISOString(),
      settings: {
        fileModificationEnabled: document.getElementById("enableFileModification")?.checked || false,
        autoBackup: document.getElementById("autoBackup")?.checked || true,
        versioningEnabled: document.getElementById("enableVersioning")?.checked || false,
      },
    }

    const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
    savedAIs.push(aiData)
    localStorage.setItem("savedAIs", JSON.stringify(savedAIs))

    let savedPath = "로컬 스토리지"
    if (aiData.settings.autoBackup && window.fileSystemManager) {
      try {
        savedPath = await window.fileSystemManager.saveAIFile(aiData)
      } catch (error) {
        console.error("파일 저장 실패:", error)
        savedPath = window.fileSystemManager.downloadAIFile(aiData)
      }
    }

    showSuccessMessage(`AI가 성공적으로 생성되었습니다!\n저장 위치: ${savedPath}`)

    createModal.classList.remove("active")
    loadSavedAIs()
  })

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
                model: ai.model || "llama3",
                template: ai.template || ai.prompt,
                createdAt: new Date().toISOString(),
                settings: ai.settings || {},
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
              model: jsonData.model || "llama3",
              template: jsonData.template || jsonData.prompt,
              createdAt: new Date().toISOString(),
              settings: jsonData.settings || {},
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
            model: ai.model || "llama3",
            template: ai.template,
            isDefault: true,
            createdAt: new Date().toISOString(),
            settings: {
              fileModificationEnabled: false,
              autoBackup: true,
              versioningEnabled: false,
            },
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
      const fileModBadge = ai.settings?.fileModificationEnabled ? '<span class="file-mod-badge">📁</span>' : ""

      aiCard.innerHTML = `
        <div class="ai-card-header">
          <h3>${ai.name}</h3>
          <div class="badges">
            ${defaultBadge}
            ${fileModBadge}
          </div>
        </div>
        <p><strong>모델:</strong> ${ai.model || "llama3"}</p>
        <p><strong>용도:</strong> ${ai.purposes ? ai.purposes.join(", ") : "N/A"}</p>
        <p><strong>성격:</strong> ${ai.personalities ? ai.personalities.join(", ") : "N/A"}</p>
        <p><strong>생성일:</strong> ${new Date(ai.createdAt).toLocaleDateString()}</p>
        <div class="ai-actions">
          <button class="use-ai-btn" onclick="useAI(${ai.id})">사용하기</button>
          ${!ai.isDefault ? `<button class="delete-ai-btn" onclick="deleteAI(${ai.id})">삭제</button>` : ""}
          <button class="download-ai-btn" onclick="downloadAI(${ai.id})">다운로드</button>
          <button class="edit-ai-btn" onclick="editAI(${ai.id})">편집</button>
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
        <div class="chat-item-header">
          <h4>${chat.aiName || "AI 어시스턴트"}</h4>
          <button class="delete-chat-btn" onclick="deleteChatHistory(${chat.id})" title="채팅 삭제">🗑️</button>
        </div>
        <p><strong>마지막 메시지:</strong> ${chat.lastMessage.substring(0, 100)}...</p>
        <p><strong>메시지 수:</strong> ${chat.messages ? chat.messages.length : 0}개</p>
        <p><strong>날짜:</strong> ${new Date(chat.timestamp).toLocaleString()}</p>
        <div class="chat-actions">
          <button class="view-detail-btn" onclick="viewChatDetail(${chat.id})">자세히 보기</button>
        </div>
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

  function loadSystemInfo() {
    const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]")

    document.getElementById("aiCount").textContent = savedAIs.length
    document.getElementById("chatCount").textContent = chatHistory.length

    const totalData = JSON.stringify({
      savedAIs,
      chatHistory,
      userMemory: JSON.parse(localStorage.getItem("userMemory") || "{}"),
    })
    const memoryUsage = (new Blob([totalData]).size / 1024).toFixed(2)
    document.getElementById("memoryUsage").textContent = `${memoryUsage} KB`
  }

  document.getElementById("exportAllData")?.addEventListener("click", () => {
    const allData = {
      savedAIs: JSON.parse(localStorage.getItem("savedAIs") || "[]"),
      chatHistory: JSON.parse(localStorage.getItem("chatHistory") || "[]"),
      userMemory: JSON.parse(localStorage.getItem("userMemory") || "{}"),
      exportDate: new Date().toISOString(),
    }

    const dataStr = JSON.stringify(allData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `PRIME_backup_${new Date().toISOString().split("T")[0]}.json`
    link.click()

    URL.revokeObjectURL(link.href)
    showSuccessMessage("모든 데이터가 내보내기되었습니다!")
  })

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

  window.editAI = (aiId) => {
    const savedAIs = JSON.parse(localStorage.getItem("savedAIs") || "[]")
    const ai = savedAIs.find((a) => a.id === aiId)
    if (ai) {
      document.getElementById("aiName").value = ai.name
      document.getElementById("promptEditor").value = ai.template

      createModal.classList.add("active")
      showSuccessMessage(`${ai.name} AI 편집 모드입니다.`)
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
    if (ai && window.fileSystemManager) {
      window.fileSystemManager.downloadAIFile(ai)
      showSuccessMessage(`${ai.name} AI가 다운로드되었습니다!`)
    }
  }

  window.deleteChatHistory = (chatId) => {
    if (confirm("정말로 이 채팅 기록을 삭제하시겠습니까?\n삭제된 채팅은 복구할 수 없습니다.")) {
      const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]")
      const filteredHistory = chatHistory.filter((chat) => chat.id !== chatId)
      localStorage.setItem("chatHistory", JSON.stringify(filteredHistory))

      loadChatHistory()
      loadSystemInfo()
      showSuccessMessage("채팅 기록이 삭제되었습니다.")
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
      max-width: 300px;
      white-space: pre-line;
    `
    successDiv.textContent = message

    document.body.appendChild(successDiv)

    setTimeout(() => {
      successDiv.style.animation = "slideOutRight 0.5s ease-in"
      setTimeout(() => successDiv.remove(), 500)
    }, 4000)
  }

  loadSavedAIs()
  loadChatHistory()

  const endChatBtn = document.getElementById("endChatBtn")
  const viewMemoryBtn = document.getElementById("viewMemoryBtn")
  const clearMemoryBtn = document.getElementById("clearMemoryBtn")

  if (endChatBtn) {
    endChatBtn.addEventListener("click", endCurrentChat)
  }

  if (viewMemoryBtn) {
    viewMemoryBtn.addEventListener("click", () => {
      navItems.forEach((nav) => nav.classList.remove("active"))
      contentSections.forEach((section) => section.classList.remove("active"))
      document.querySelector('[data-section="memory"]').classList.add("active")
      document.getElementById("memory-section").classList.add("active")
      loadMemoryData()
    })
  }

  if (clearMemoryBtn) {
    clearMemoryBtn.addEventListener("click", clearUserMemory)
  }

  function endCurrentChat() {
    if (currentChatId && confirm("현재 채팅을 종료하시겠습니까?")) {
      analyzeAndSaveUserData()
      currentChatId = null
      chatMessages.innerHTML = ""
      showSuccessMessage("채팅이 종료되고 기록에 저장되었습니다!")
      loadChatHistory()
    }
  }

  function analyzeAndSaveUserData() {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]")
    const currentChat = chatHistory.find((chat) => chat.id === currentChatId)

    if (!currentChat) return

    const userMemory = JSON.parse(localStorage.getItem("userMemory") || "{}")

    userMemory.totalChats = (userMemory.totalChats || 0) + 1
    userMemory.lastChatDate = new Date().toISOString()

    if (!userMemory.aiUsage) userMemory.aiUsage = {}
    userMemory.aiUsage[currentChat.aiName] = (userMemory.aiUsage[currentChat.aiName] || 0) + 1

    const mostUsedAI = Object.keys(userMemory.aiUsage).reduce((a, b) =>
      userMemory.aiUsage[a] > userMemory.aiUsage[b] ? a : b,
    )
    userMemory.favoriteAI = mostUsedAI

    const userMessages = currentChat.messages.filter((msg) => msg.type === "user")
    const messageTexts = userMessages.map((msg) => msg.content.toLowerCase())

    const interests = extractInterests(messageTexts)
    if (!userMemory.interests) userMemory.interests = {}

    interests.forEach((interest) => {
      userMemory.interests[interest] = (userMemory.interests[interest] || 0) + 1
    })

    const topInterests = Object.keys(userMemory.interests)
      .sort((a, b) => userMemory.interests[b] - userMemory.interests[a])
      .slice(0, 3)
    userMemory.mainInterests = topInterests

    analyzeConversationStyle(userMessages, userMemory)

    if (!userMemory.insights) userMemory.insights = []

    const newInsight = {
      id: Date.now(),
      type: "chat_analysis",
      title: `${currentChat.aiName}와의 대화 분석`,
      content: `${userMessages.length}개 메시지, 주요 키워드: ${interests.slice(0, 3).join(", ")}`,
      timestamp: new Date().toISOString(),
    }

    userMemory.insights.unshift(newInsight)

    if (userMemory.insights.length > 20) {
      userMemory.insights = userMemory.insights.slice(0, 20)
    }

    localStorage.setItem("userMemory", JSON.stringify(userMemory))
  }

  function extractInterests(messages) {
    const keywords = [
      "프로그래밍",
      "코딩",
      "개발",
      "웹",
      "앱",
      "데이터",
      "AI",
      "머신러닝",
      "디자인",
      "UI",
      "UX",
      "그래픽",
      "예술",
      "창작",
      "비즈니스",
      "마케팅",
      "경영",
      "창업",
      "투자",
      "학습",
      "공부",
      "교육",
      "책",
      "독서",
      "건강",
      "운동",
      "요리",
      "여행",
      "음악",
      "영화",
      "게임",
      "스포츠",
      "취미",
      "문화",
    ]

    const foundInterests = []
    const messageText = messages.join(" ")

    keywords.forEach((keyword) => {
      if (messageText.includes(keyword)) {
        foundInterests.push(keyword)
      }
    })

    return foundInterests
  }

  function analyzeConversationStyle(userMessages, userMemory) {
    if (!userMemory.conversationStyle) userMemory.conversationStyle = {}

    const totalMessages = userMessages.length
    const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / totalMessages

    const questionCount = userMessages.filter((msg) => msg.content.includes("?")).length
    const questionRatio = questionCount / totalMessages

    const emotionalWords = ["좋다", "나쁘다", "기쁘다", "슬프다", "화나다", "놀랍다", "감사", "미안"]
    const emotionalCount = userMessages.filter((msg) =>
      emotionalWords.some((word) => msg.content.includes(word)),
    ).length
    const emotionalRatio = emotionalCount / totalMessages

    userMemory.conversationStyle = {
      avgMessageLength: Math.round(avgLength),
      questionRatio: Math.round(questionRatio * 100),
      emotionalRatio: Math.round(emotionalRatio * 100),
      totalMessages: totalMessages,
    }
  }

  function loadMemoryData() {
    const userMemory = JSON.parse(localStorage.getItem("userMemory") || "{}")

    document.getElementById("totalChats").textContent = userMemory.totalChats || 0
    document.getElementById("favoriteAI").textContent = userMemory.favoriteAI || "-"
    document.getElementById("mainInterests").textContent = userMemory.mainInterests
      ? userMemory.mainInterests.join(", ")
      : "-"

    const insightsContainer = document.getElementById("memoryInsights")
    if (insightsContainer) {
      insightsContainer.innerHTML = ""

      if (userMemory.insights && userMemory.insights.length > 0) {
        userMemory.insights.forEach((insight) => {
          const insightBox = document.createElement("div")
          insightBox.className = "insight-box"
          insightBox.innerHTML = `
            <div class="insight-content">
              <h4>${insight.title}</h4>
              <p>${insight.content}</p>
              <small>${new Date(insight.timestamp).toLocaleString()}</small>
            </div>
            <button class="delete-insight-btn" onclick="deleteInsight('${insight.id}')">×</button>
          `
          insightsContainer.appendChild(insightBox)
        })
      } else {
        insightsContainer.innerHTML = '<p class="no-insights">아직 분석된 인사이트가 없습니다.</p>'
      }
    }
  }

  window.deleteInsight = (insightId) => {
    const userMemory = JSON.parse(localStorage.getItem("userMemory") || "{}")
    if (userMemory.insights) {
      userMemory.insights = userMemory.insights.filter((insight) => insight.id != insightId)
      localStorage.setItem("userMemory", JSON.stringify(userMemory))
      loadMemoryData()
      showSuccessMessage("인사이트가 삭제되었습니다.")
    }
  }

  function clearUserMemory() {
    if (confirm("모든 메모리를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      localStorage.removeItem("userMemory")
      loadMemoryData()
      showSuccessMessage("메모리가 초기화되었습니다.")
    }
  }

  function getPersonalizedPrompt(basePrompt, userInput) {
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
      const aiPrompt = getPersonalizedPrompt(selectedAI.template, message)
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

  window.addMessage = addMessage

  async function callOllamaAPI(prompt, model) {
    const requestBody = { model: model, prompt: prompt, stream: false }

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${responseText}`)
    }

    try {
      const data = JSON.parse(responseText)
      return data.response || "응답을 받을 수 없습니다."
    } catch (e) {
      throw new Error("서버 응답이 유효한 JSON 형식이 아닙니다.")
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
        let welcomeMessage = `안녕하세요! ${selectedAI.name}입니다. 무엇을 도와드릴까요?`

        // 검색 AI인 경우 특별한 환영 메시지와 검색 인터페이스 표시
        if (selectedAI.purposes && selectedAI.purposes.includes("검색")) {
          welcomeMessage = `안녕하세요! ${selectedAI.name}입니다. 검색을 도와드리겠습니다. 아래 검색 도구를 사용하거나 직접 질문해주세요!`
        }

        addMessage(welcomeMessage, "ai")
      }
    }
  })
})
