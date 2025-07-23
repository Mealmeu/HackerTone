from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import requests
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    return send_from_directory('templates', 'index.html')

@app.route('/api/expand', methods=['POST'])
def expand_prompt():
    start = datetime.now()
    data = request.get_json()
    user_prompt = data.get("prompt", "")

    ollama_payload = {
        "model": "llama3",
        "prompt": f"""
당신은 전문적인 프롬프트 엔지니어입니다. 아래의 프롬프트를 훨씬 더 구체적이고 세부적이고 확장된 버전으로 바꿔주세요.  
프롬프트는 간단할 수 있지만, 당신은 AI가 정확히 원하는 결과를 생성할 수 있도록 철저하게 구조화하고, 목적, 맥락, 기대 출력 등을 포함한 전문적인 지시문으로 변환합니다.

입력 프롬프트:
\"{user_prompt}\"

확장된 프롬프트:
"""
    }

    try:
        res = requests.post("http://localhost:11434/api/generate", json=ollama_payload, stream=True)
        expanded = ""

        for line in res.iter_lines():
            if line:
                part = line.decode("utf-8")
                if part.startswith("data:"):
                    json_part = part[5:].strip()
                    if json_part == "[DONE]":
                        break
                    try:
                        content = eval(json_part).get("response", "")
                        expanded += content
                    except Exception:
                        pass

        elapsed = (datetime.now() - start).total_seconds()
        return jsonify({
            "expanded_prompt": expanded.strip(),
            "time_taken": f"{elapsed:.3f}초"
        })

    except Exception as e:
        return jsonify({
            "error": f"Ollama 요청 실패: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
