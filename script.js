const chatBox = document.getElementById("chat");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const fileUpload = document.getElementById("fileUpload");
const tabButtons = document.querySelectorAll(".tab-button");

let currentTask = "text";

// ⚠️ Use your own API key securely
const API_KEY = "sk-voidai-v2N9O4zjE_7X3lzcfn7clEqhnhvHS0Dqf3WwCCg3EEaW8Aif9vuHJozbyXitnzSObiloDj5o0qt6LyICmpPE7R6QI7DE2DCNqM8MtYdLLXhpfZPyy0W_cd8HrrKtvRfZOS-uSA"; 

// Keep your original model mapping
const modelMap = {
    text: "gpt-5-chat",
    code: "deepseek-v3.1",
    image: ["gpt-image-1"],
    embedding: "text-embedding-3-large",
    speech: "tts-1",
    transcription: "whisper-1",
    advanced: ["llama-4-maverick-17b-128e-instruct","kimi-k2-instruct","grok-3","claude-3-haiku-20240307"]
};

// Tab switching
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentTask = btn.dataset.task;
    });
});

// Send message
sendBtn.addEventListener("click", async () => {
    const message = userInput.value.trim();
    if (!message && fileUpload.files.length === 0) return;

    appendMessage("user", message);

    const selectedModel = Array.isArray(modelMap[currentTask])
        ? modelMap[currentTask][0]
        : modelMap[currentTask];

    let body = {
        model: selectedModel,
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: message }
        ]
    };

    try {
        const res = await fetch("https://api.voidai.app/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errText = await res.text();
            appendMessage("bot", `HTTP Error ${res.status}: ${errText}`);
            return;
        }

        const data = await res.json();
        console.log("API Response:", data);

        let output = "No response";

        if (["text","code","advanced"].includes(currentTask))
            output = data.choices?.[0]?.message?.content || output;
        else if (currentTask === "image")
            output = data.choices?.[0]?.image_url || output;
        else if (currentTask === "embedding")
            output = JSON.stringify(data.data || {});
        else if (currentTask === "speech")
            output = data.choices?.[0]?.audio_url || null;
        else if (currentTask === "transcription")
            output = data.choices?.[0]?.text || output;

        appendMessage("bot", output, currentTask);
    } catch (err) {
        console.error(err);
        appendMessage("bot", "Error contacting API.");
    }

    userInput.value = "";
    fileUpload.value = "";
});

function appendMessage(sender, text, task = "text") {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble", sender);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (task === "code") bubble.innerHTML = `<pre><code>${text}</code></pre><small>${timestamp}</small>`;
    else if (task === "image") bubble.innerHTML = `<img src="${text}" alt="Image"><small>${timestamp}</small>`;
    else if (task === "speech") bubble.innerHTML = `<audio controls src="${text}"></audio><small>${timestamp}</small>`;
    else bubble.innerHTML = `${text}<small>${timestamp}</small>`;

    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
}
