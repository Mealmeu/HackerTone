from flask import Flask, render_template, request, jsonify
import requests
import re
from pathlib import Path
import json

app = Flask(__name__)

AIS_DIR = Path("ais")
OLLAMA_API_URL = "http://localhost:11434/api/generate"

def load_all_prompts():
    all_prompts = []
    for json_file in AIS_DIR.glob("*.json"):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for prompt in data:
                        prompt["_source_file"] = json_file.name
                        all_prompts.append(prompt)
        except Exception as e:
            print(f"[오류] 파일 {json_file.name} 불러오기 실패: {e}")
    return all_prompts

def make_enhanced_prompt(user_input: str, template: str) -> str:
    return template.replace("{user_input}", user_input).strip()

def generate_prompt(user_text: str, model: str, template: str) -> str:
    enhanced_prompt = make_enhanced_prompt(user_text, template)
    response = requests.post(
        OLLAMA_API_URL,
        json={
            "model": model,
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

@app.route("/")
def index():
    prompts = load_all_prompts()
    if not prompts:
        return "사용 가능한 프롬프트가 없습니다. 'ais/' 폴더에 .json 파일을 추가해 주세요.", 500
    return render_template("index.html", prompts=prompts)

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    if not data:
        return jsonify({"error": "잘못된 요청입니다."}), 400
    
    user_input = data.get("user_input", "").strip()
    model = data.get("model", "")
    template = data.get("")

    if not user_input or not model or not template:
        return jsonify({"error": "필수 데이터가 누락되었습니다."}), 400

    try:
        result = generate_prompt(user_input, model, template)
        return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
