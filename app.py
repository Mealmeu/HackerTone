"""
# Web
# 프롬프트에 " 하나 제거함
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
        "prompt": f""
당신은 전문적인 프롬프트 엔지니어입니다. 아래의 프롬프트를 훨씬 더 구체적이고 세부적이고 확장된 버전으로 바꿔주세요.  
프롬프트는 간단할 수 있지만, 당신은 AI가 정확히 원하는 결과를 생성할 수 있도록 철저하게 구조화하고, 목적, 맥락, 기대 출력 등을 포함한 전문적인 지시문으로 변환합니다.

입력 프롬프트:
\"{user_prompt}\"

확장된 프롬프트:
""
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
"""

import requests
import re

OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3"

def make_enhanced_prompt(user_input: str) -> str:

    template = f"""
아래에 사용자가 간단하게 입력한 문장이나 키워드가 있습니다.
당신은 AI 프롬프트 전문가로서, 이 간단한 입력을 바탕으로
최대한 구체적이고 명확하며 창의적인 프롬프트를 새롭게 작성해야 합니다.

[작성할 프롬프트는 다음 사항을 반드시 포함하고 충실히 반영해야 합니다]
1. 프롬프트는 무조건 한국어로 작성합니다.
2. 사용자의 의도와 주제를 명확히 이해하고, 주제에 대한 상세하고 전문적인 설명을 포함합니다.
3. 필요한 배경정보와 맥락, 세부사항을 최대한 보강하여 AI가 명확하게 답변할 수 있도록 만듭니다.
4. 예상되는 목표와 목적을 구체적으로 명시하여 프롬프트가 달성하고자 하는 결과를 분명히 합니다.
5. 가능한 한 혁신적이고 창의적이며 현실적인 접근을 반영해 프롬프트의 품질을 높입니다.
6. 출력 형식, 스타일, 톤, 길이 제한 등 조건이 있다면 반드시 포함해 명확하게 지시합니다.
7. 문장은 전문적이고 이해하기 쉽게 작성하되, 불필요한 중복이나 모호한 표현은 피합니다.
8. 최종 결과물은 오직 프롬프트 내용만 포함하고, 해설, 예시, 불필요한 텍스트는 포함하지 않습니다.
9. 전문용어도 포함하여 깊이 있게 작성합니다.
10. **그 외 해설, 예시, 부가 설명, 영어 텍스트는 절대로 포함하지 마세요.**

사용자가 입력한 문장은 다음과 같습니다: "{user_input}"
이 내용을 바탕으로 AI가 사용할 최상의 프롬프트를 작성해 주세요.
"""
    return template.strip()

def generate_prompt(user_text: str) -> str:
    enhanced_prompt = make_enhanced_prompt(user_text)
    response = requests.post(
        OLLAMA_API_URL,
        json={
            "model": MODEL_NAME,
            "prompt": enhanced_prompt,
            "stream": False
        }
    )
    if response.status_code == 200:
        raw_answer = response.json().get("response", "").strip()
        clean_answer = re.sub(r"<think>.*?</think>", "", raw_answer, flags=re.DOTALL).strip()

        return clean_answer
    else:
        return "[오류: AI 응답 실패]"

if __name__ == "__main__":
    while True:
        user_input = input(">> ")
        if user_input.lower() in ("exit", "quit"):
            break
        result = generate_prompt(user_input)
        print("\n[생성된 프롬프트]\n", result, "\n")
