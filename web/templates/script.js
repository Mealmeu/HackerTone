document.addEventListener("DOMContentLoaded", () => {
    const prompts = JSON.parse(document.getElementById("prompts-data").textContent);
    const form = document.getElementById("prompt-form");
    const resultDiv = document.getElementById("result");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        resultDiv.style.display = "none";
        resultDiv.textContent = "생성 중... 잠시만 기다려 주세요.";

        const selectedIndex = document.getElementById("prompt-select").value;
        const userInput = document.getElementById("user-input").value.trim();

        if (!userInput) {
            alert("입력 내용을 작성해 주세요.");
            return;
        }

        const selectedPrompt = prompts[selectedIndex];
        if (!selectedPrompt) {
            alert("프롬프트를 다시 선택해 주세요.");
            return;
        }

        const payload = {
            user_input: userInput,
            model: selectedPrompt.model,
            template: selectedPrompt.template
        };

        try {
            const response = await fetch("/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                resultDiv.textContent = `오류 발생: ${err.error || "알 수 없는 오류"}`;
                resultDiv.style.display = "block";
                return;
            }

            const data = await response.json();
            resultDiv.textContent = data.result || "[결과 없음]";
            resultDiv.style.display = "block";

        } catch (error) {
            resultDiv.textContent = `통신 오류: ${error.message}`;
            resultDiv.style.display = "block";
        }
    });
});
