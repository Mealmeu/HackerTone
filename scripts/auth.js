document.addEventListener("DOMContentLoaded", () => {
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")
  const loginForm = document.getElementById("loginForm")
  const signupForm = document.getElementById("signupForm")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab

      tabBtns.forEach((b) => b.classList.remove("active"))
      tabContents.forEach((c) => c.classList.remove("active"))

      btn.classList.add("active")
      document.getElementById(targetTab).classList.add("active")
    })
  })

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const email = document.getElementById("loginEmail").value
    const password = document.getElementById("loginPassword").value

    if (email && password) {
      const userData = {
        email: email,
        name: email.split("@")[0],
        loginTime: new Date().toISOString(),
      }

      localStorage.setItem("currentUser", JSON.stringify(userData))

      showSuccessAnimation(() => {
        window.location.href = "main.html"
      })
    } else {
      showErrorMessage("이메일과 비밀번호를 입력해주세요.")
    }
  })

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault()

    const name = document.getElementById("signupName").value
    const email = document.getElementById("signupEmail").value
    const password = document.getElementById("signupPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (!name || !email || !password || !confirmPassword) {
      showErrorMessage("모든 필드를 입력해주세요.")
      return
    }

    if (password !== confirmPassword) {
      showErrorMessage("비밀번호가 일치하지 않습니다.")
      return
    }

    const userData = {
      name: name,
      email: email,
      signupTime: new Date().toISOString(),
    }

    localStorage.setItem("currentUser", JSON.stringify(userData))

    showSuccessAnimation(() => {
      window.location.href = "main.html"
    })
  })

  function showSuccessAnimation(callback) {
    const authCard = document.querySelector(".auth-card")
    authCard.style.transform = "scale(1.05)"
    authCard.style.background = "linear-gradient(135deg, #48bb78, #38a169)"

    setTimeout(() => {
      authCard.style.transform = "scale(0.95)"
      authCard.style.opacity = "0"

      setTimeout(callback, 300)
    }, 500)
  }

  function showErrorMessage(message) {
    const existingError = document.querySelector(".error-message")
    if (existingError) {
      existingError.remove()
    }

    const errorDiv = document.createElement("div")
    errorDiv.className = "error-message"
    errorDiv.textContent = message
    errorDiv.style.cssText = `
            background: #ff6b6b;
            color: white;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            text-align: center;
            animation: shake 0.5s ease-in-out;
        `

    if (!document.querySelector("#shake-animation")) {
      const style = document.createElement("style")
      style.id = "shake-animation"
      style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `
      document.head.appendChild(style)
    }

    const activeForm = document.querySelector(".tab-content.active .auth-form")
    activeForm.insertBefore(errorDiv, activeForm.firstChild)

    setTimeout(() => {
      errorDiv.style.opacity = "0"
      setTimeout(() => errorDiv.remove(), 300)
    }, 3000)
  }

  const inputs = document.querySelectorAll("input")
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.style.transform = "translateY(-2px)"
    })

    input.addEventListener("blur", function () {
      this.parentElement.style.transform = "translateY(0)"
    })
  })
})
