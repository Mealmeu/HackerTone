import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'

class AuthManager {
  constructor() {
    this.auth = window.firebaseAuth
    this.currentUser = null
    this.initializeEventListeners()
    this.checkAuthState()
  }

  initializeEventListeners() {
    const tabBtns = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")
    const loginForm = document.getElementById("loginForm")
    const signupForm = document.getElementById("signupForm")
    const forgotPasswordBtn = document.getElementById("forgotPasswordBtn")

    // 탭 전환
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab

        tabBtns.forEach((b) => b.classList.remove("active"))
        tabContents.forEach((c) => c.classList.remove("active"))

        btn.classList.add("active")
        document.getElementById(targetTab).classList.add("active")
        
        this.clearErrors()
      })
    })

    // 로그인 폼
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleLogin()
    })

    // 회원가입 폼
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleSignup()
    })

    // 비밀번호 재설정
    forgotPasswordBtn.addEventListener("click", () => {
      this.handleForgotPassword()
    })

    // 입력 필드 애니메이션
    const inputs = document.querySelectorAll("input")
    inputs.forEach((input) => {
      input.addEventListener("focus", function () {
        this.parentElement.style.transform = "translateY(-2px)"
      })

      input.addEventListener("blur", function () {
        this.parentElement.style.transform = "translateY(0)"
      })
    })
  }

  async handleLogin() {
    const email = document.getElementById("loginEmail").value.trim()
    const password = document.getElementById("loginPassword").value
    const loginBtn = document.getElementById("loginBtn")

    if (!email || !password) {
      this.showError("이메일과 비밀번호를 입력해주세요.")
      return
    }

    this.setLoading(loginBtn, true)
    this.clearErrors()

    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password)
      const user = userCredential.user

      // 사용자 정보 저장
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split("@")[0],
        loginTime: new Date().toISOString(),
      }

      localStorage.setItem("currentUser", JSON.stringify(userData))

      this.showSuccessMessage("로그인 성공!")
      
      setTimeout(() => {
        window.location.href = "main.html"
      }, 1000)

    } catch (error) {
      console.error("로그인 오류:", error)
      this.handleAuthError(error)
    } finally {
      this.setLoading(loginBtn, false)
    }
  }

  async handleSignup() {
    const name = document.getElementById("signupName").value.trim()
    const email = document.getElementById("signupEmail").value.trim()
    const password = document.getElementById("signupPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value
    const signupBtn = document.getElementById("signupBtn")

    // 유효성 검사
    if (!name || !email || !password || !confirmPassword) {
      this.showError("모든 필드를 입력해주세요.")
      return
    }

    if (password !== confirmPassword) {
      this.showError("비밀번호가 일치하지 않습니다.")
      return
    }

    if (password.length < 6) {
      this.showError("비밀번호는 최소 6자 이상이어야 합니다.")
      return
    }

    this.setLoading(signupBtn, true)
    this.clearErrors()

    try {
      // 회원가입
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password)
      const user = userCredential.user

      // 사용자 프로필 업데이트
      await updateProfile(user, {
        displayName: name
      })

      // 사용자 정보 저장
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        signupTime: new Date().toISOString(),
      }

      localStorage.setItem("currentUser", JSON.stringify(userData))

      this.showSuccessMessage("회원가입 성공!")
      
      setTimeout(() => {
        window.location.href = "main.html"
      }, 1000)

    } catch (error) {
      console.error("회원가입 오류:", error)
      this.handleAuthError(error)
    } finally {
      this.setLoading(signupBtn, false)
    }
  }

  async handleForgotPassword() {
    const email = document.getElementById("loginEmail").value.trim()
    
    if (!email) {
      this.showError("이메일을 입력한 후 비밀번호 재설정을 클릭해주세요.")
      return
    }

    try {
      await sendPasswordResetEmail(this.auth, email)
      this.showSuccessMessage("비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.")
    } catch (error) {
      console.error("비밀번호 재설정 오류:", error)
      this.handleAuthError(error)
    }
  }

  checkAuthState() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // 이미 로그인된 상태라면 메인 페이지로 리다이렉트
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
          window.location.href = "main.html"
        }
        this.currentUser = user
      } else {
        this.currentUser = null
        localStorage.removeItem("currentUser")
      }
    })
  }

  handleAuthError(error) {
    let message = "오류가 발생했습니다."
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = "등록되지 않은 이메일입니다."
        break
      case 'auth/wrong-password':
        message = "비밀번호가 올바르지 않습니다."
        break
      case 'auth/email-already-in-use':
        message = "이미 사용 중인 이메일입니다."
        break
      case 'auth/weak-password':
        message = "비밀번호가 너무 약합니다. 최소 6자 이상 입력해주세요."
        break
      case 'auth/invalid-email':
        message = "유효하지 않은 이메일 형식입니다."
        break
      case 'auth/too-many-requests':
        message = "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요."
        break
      case 'auth/network-request-failed':
        message = "네트워크 연결을 확인해주세요."
        break
      default:
        message = error.message || "알 수 없는 오류가 발생했습니다."
    }
    
    this.showError(message)
  }

  setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text')
    const btnLoading = button.querySelector('.btn-loading')
    
    if (isLoading) {
      btnText.style.display = 'none'
      btnLoading.style.display = 'inline'
      button.disabled = true
    } else {
      btnText.style.display = 'inline'
      btnLoading.style.display = 'none'
      button.disabled = false
    }
  }

  showError(message) {
    this.clearErrors()
    
    const errorDiv = document.createElement("div")
    errorDiv.className = "error-message"
    errorDiv.textContent = message
    
    const activeForm = document.querySelector(".tab-content.active .auth-form")
    activeForm.insertBefore(errorDiv, activeForm.firstChild)

    setTimeout(() => {
      errorDiv.style.opacity = "0"
      setTimeout(() => errorDiv.remove(), 300)
    }, 5000)
  }

  showSuccessMessage(message) {
    this.clearErrors()
    
    const successDiv = document.createElement("div")
    successDiv.className = "success-message"
    successDiv.textContent = message
    successDiv.style.cssText = `
      background: #48bb78;
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      animation: slideIn 0.5s ease-in-out;
    `
    
    const activeForm = document.querySelector(".tab-content.active .auth-form")
    activeForm.insertBefore(successDiv, activeForm.firstChild)

    setTimeout(() => {
      successDiv.style.opacity = "0"
      setTimeout(() => successDiv.remove(), 300)
    }, 3000)
  }

  clearErrors() {
    const existingError = document.querySelector(".error-message")
    const existingSuccess = document.querySelector(".success-message")
    
    if (existingError) existingError.remove()
    if (existingSuccess) existingSuccess.remove()
  }
}

// DOM이 로드되면 AuthManager 초기화
document.addEventListener("DOMContentLoaded", () => {
  // Firebase가 로드될 때까지 대기
  const checkFirebase = () => {
    if (window.firebaseAuth) {
      new AuthManager()
    } else {
      setTimeout(checkFirebase, 100)
    }
  }
  checkFirebase()
})
