# chat_cli.py
from pathlib import Path
import requests
import re
import json
from datetime import datetime
from InquirerPy import inquirer

OLLAMA_API_URL = "http://localhost:11434/api/generate"
AIS_DIR = Path("ais")
HISTORY_DIR = Path("history")
HISTORY_DIR.mkdir(exist_ok=True)

def load_all_prompts() -> list:
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

def select_prompt_model(prompt_list: list) -> dict:
    choices = [{"name": f"{p['name']} ({p['_source_file']})", "value": p} for p in prompt_list]
    selected = inquirer.select(
        message="[사용할 프롬프트 선택]",
        choices=choices,
        pointer="> ",
        instruction="방향키로 이동, Enter 선택"
    ).execute()
    return selected

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

def save_to_history(user: str, ai: str):
    date_str = datetime.now().strftime("%Y-%m-%d")
    log_path = HISTORY_DIR / f"{date_str}.log"
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "user": user,
        "ai": ai
    }
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

def load_history_by_date():
    logs = sorted(HISTORY_DIR.glob("*.log"))
    if not logs:
        print("저장된 히스토리가 없습니다.")
        return
    choices = [{"name": log.name, "value": log} for log in logs]
    selected = inquirer.select(
        message="[불러올 날짜 선택]",
        choices=choices,
        pointer="> ",
        instruction="방향키로 이동, Enter 선택"
    ).execute()

    print(f"\n--- {selected.name} 대화 로그 ---")
    with open(selected, "r", encoding="utf-8") as f:
        for line in f:
            try:
                record = json.loads(line.strip())
                print(f"\n[{record['timestamp']}]\n사용자: {record['user']}\nAI: {record['ai']}")
            except:
                continue

def detect_past_reference(text: str) -> str | None:
    pattern = r"(과거에|전에|예전에|기억나|저번에|그때)"
    if re.search(pattern, text):
        match = re.search(r"(과거에|전에|예전에|기억나|저번에|그때)(.*?)\s*(\?|했었|만든|한|했던)?", text)
        if match:
            return match.group(2).strip()
    return None

def search_history_for(query: str, limit: int = 3) -> list:
    results = []
    for log_file in sorted(HISTORY_DIR.glob("*.log"), reverse=True):
        with open(log_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    record = json.loads(line.strip())
                    if query in record["user"] or query in record["ai"]:
                        results.append(record)
                        if len(results) >= limit:
                            return results
                except:
                    continue
    return results

if __name__ == "__main__":
    try:
        prompt_list = load_all_prompts()
        if not prompt_list:
            print("사용 가능한 프롬프트가 없습니다. 'ais/' 폴더에 .json 파일을 추가해 주세요.")
            exit(1)

        selected_prompt = select_prompt_model(prompt_list)
        model_name = selected_prompt["model"]
        template_text = selected_prompt["template"]

        mode = inquirer.select(
            message="[모드 선택]",
            choices=[
                {"name": "대화 시작", "value": "chat"},
                {"name": "히스토리 불러오기", "value": "history"}
            ]
        ).execute()

        if mode == "history":
            load_history_by_date()
        else:
            while True:
                user_input = input("\n>> 입력 (종료하려면 'exit') : ")
                if user_input.lower() in ("exit", "quit"):
                    break

                ref_query = detect_past_reference(user_input)
                if ref_query:
                    matches = search_history_for(ref_query)
                    if matches:
                        print("\n[📁 과거 대화 기록과 유사한 내용이 있어요]")
                        for record in matches:
                            print(f"\n[{record['timestamp']}]\n사용자: {record['user']}\nAI: {record['ai']}")

                try:
                    result = generate_prompt(user_input, model_name, template_text)
                    print("\n[AI 응답]\n", result, "\n")
                    save_to_history(user_input, result)
                except Exception as e:
                    print(f"[오류] {e}")

    except Exception as e:
        print(f"[오류] {e}")
