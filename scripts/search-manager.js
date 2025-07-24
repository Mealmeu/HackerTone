class SearchManager {
  constructor() {
    this.searchEngines = {
      google: {
        name: "Google",
        url: "https://www.google.com/search?q=",
        icon: "🔍",
      },
      naver: {
        name: "Naver",
        url: "https://search.naver.com/search.naver?query=",
        icon: "🟢",
      },
      duckduckgo: {
        name: "DuckDuckGo",
        url: "https://duckduckgo.com/?q=",
        icon: "🦆",
      },
      wikipedia: {
        name: "Wikipedia",
        url: "https://ko.wikipedia.org/wiki/Special:Search?search=",
        icon: "📖",
      },
    }
  }

  async searchWikipedia(query) {
    try {
      const response = await fetch(`https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)

      if (response.ok) {
        const data = await response.json()
        return {
          title: data.title,
          extract: data.extract,
          url: data.content_urls?.desktop?.page || `https://ko.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        }
      }
    } catch (error) {
      console.error("Wikipedia 검색 실패:", error)
    }
    return null
  }

  openSearch(engine, query) {
    const searchEngine = this.searchEngines[engine]
    if (searchEngine) {
      const searchUrl = searchEngine.url + encodeURIComponent(query)
      window.open(searchUrl, "_blank")
      return true
    }
    return false
  }

  async performSearch(query, engine = "wikipedia") {
    if (engine === "wikipedia") {
      const result = await this.searchWikipedia(query)
      if (result) {
        return {
          type: "wikipedia",
          title: result.title,
          content: result.extract,
          url: result.url,
        }
      }
    }

    // 다른 검색 엔진은 새 창으로 열기
    this.openSearch(engine, query)
    return {
      type: "external",
      message: `${this.searchEngines[engine].name}에서 "${query}" 검색 결과를 새 창에서 확인하세요.`,
    }
  }

  createSearchInterface() {
    return `
      <div class="search-interface">
        <div class="search-input-container">
          <input type="text" id="searchQuery" placeholder="검색어를 입력하세요..." class="search-input">
          <button id="searchBtn" class="search-btn">검색</button>
        </div>
        <div class="search-engines">
          <button class="engine-btn" data-engine="wikipedia">📖 Wikipedia</button>
          <button class="engine-btn" data-engine="google">🔍 Google</button>
          <button class="engine-btn" data-engine="naver">🟢 Naver</button>
          <button class="engine-btn" data-engine="duckduckgo">🦆 DuckDuckGo</button>
        </div>
        <div id="searchResults" class="search-results"></div>
      </div>
    `
  }

  initializeSearchInterface() {
    const searchInterface = document.querySelector(".search-interface")
    if (!searchInterface) return

    const searchInput = document.getElementById("searchQuery")
    const searchBtn = document.getElementById("searchBtn")
    const engineBtns = document.querySelectorAll(".engine-btn")
    const searchResults = document.getElementById("searchResults")

    let selectedEngine = "wikipedia"

    engineBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        engineBtns.forEach((b) => b.classList.remove("active"))
        btn.classList.add("active")
        selectedEngine = btn.dataset.engine
      })
    })

    // 기본 선택
    document.querySelector('[data-engine="wikipedia"]').classList.add("active")

    const performSearch = async () => {
      const query = searchInput.value.trim()
      if (!query) return

      searchResults.innerHTML = '<div class="search-loading">검색 중...</div>'

      try {
        const result = await this.performSearch(query, selectedEngine)

        if (result.type === "wikipedia") {
          searchResults.innerHTML = `
            <div class="search-result">
              <h4>${result.title}</h4>
              <p>${result.content}</p>
              <a href="${result.url}" target="_blank" class="result-link">자세히 보기 →</a>
            </div>
          `
        } else {
          searchResults.innerHTML = `
            <div class="search-result">
              <p>${result.message}</p>
            </div>
          `
        }
      } catch (error) {
        searchResults.innerHTML = `
          <div class="search-error">
            검색 중 오류가 발생했습니다: ${error.message}
          </div>
        `
      }
    }

    searchBtn.addEventListener("click", performSearch)
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performSearch()
      }
    })
  }
}

window.searchManager = new SearchManager()

document.addEventListener("DOMContentLoaded", () => {
  // 검색 AI가 선택되었을 때 검색 인터페이스 표시
  const originalAddMessage = window.addMessage
  if (originalAddMessage) {
    window.addMessage = function (content, type) {
      const result = originalAddMessage.call(this, content, type)

      // 검색 AI 선택 시 검색 인터페이스 추가
      if (type === "ai" && content.includes("검색을 도와드리겠습니다")) {
        const chatMessages = document.getElementById("chatMessages")
        const searchDiv = document.createElement("div")
        searchDiv.className = "message ai search-interface-message"
        searchDiv.innerHTML = window.searchManager.createSearchInterface()
        chatMessages.appendChild(searchDiv)
        chatMessages.scrollTop = chatMessages.scrollHeight

        // 검색 인터페이스 초기화
        setTimeout(() => {
          window.searchManager.initializeSearchInterface()
        }, 100)
      }

      return result
    }
  }
})
