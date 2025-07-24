// Firebase SDK 모듈 import
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'

// Firebase 설정 - 사용자 제공 설정
const firebaseConfig = {
  apiKey: "AIzaSyC_rMN4iEr0gtOUVt0ZtXySGAorr5vamU4",
  authDomain: "hackertone-45bf1.firebaseapp.com",
  databaseURL: "https://hackertone-45bf1-default-rtdb.firebaseio.com",
  projectId: "hackertone-45bf1",
  storageBucket: "hackertone-45bf1.firebasestorage.app",
  messagingSenderId: "914596429578",
  appId: "1:914596429578:web:58b87bfe1728be68e0c4f3",
  measurementId: "G-QRB81M2C3K"
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// 전역으로 export
window.firebaseAuth = auth

export { auth }
