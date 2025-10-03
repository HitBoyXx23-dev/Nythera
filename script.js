const chatBox = document.getElementById("chat");
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const taskSelect = document.getElementById("task");
const fileUpload = document.getElementById("fileUpload");

// Single VoidAI API Key
const API_KEY = "YOUR_API_KEY";

// Models per task
const modelMap = {
    text: "gpt-5-chat",
    code: "deepseek-v3.1",
    image: ["dall-e-3","gpt-image-1"], // multiple image models
    embedding: "text-embedding-3-large",
    speech: "tts-1",
    transcription: "whisper-1",
    advanced: ["llama-4-maverick-17b-128e-instruct","kimi-k2-instruct","grok-3","claude-3-haiku-20240307"]
};

sendBtn.addEventListener("click", async () => {
    const message = userInput.value.trim();
    const task = taskSelect.value;
    if(!message && fileUpload.files.length === 0) return;

    appendMessage("user", message);

    // Select model (first if multiple)
    const selectedModel = Array.isArray(modelMap[task]) ? modelMap[task][0] : modelMap[task];

    let body = {
        model: selectedModel,
        messages: [
            {role:"system", content:"You are a helpful assistant."},
            {role:"user", content: message}
        ]
    };

    // Handle file uploads
    if(fileUpload.files.length > 0){
        body.files = [];
        for(const file of fileUpload.files){
            const base64 = await toBase64(file);
            body.files.push({ name:file.name, content:base64 });
        }
    }

    try{
        const res = await fetch("https://api.voidai.app/v1/chat/completions", {
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        let output = "No response";

        if(task === "text" || task === "code" || task === "advanced") output = data.choices?.[0]?.message?.content || output;
        if(task === "image") output = data.choices?.[0]?.image_url || output;
        if(task === "embedding") output = JSON.stringify(data.data || {});
        if(task === "speech") output = data.choices?.[0]?.audio_url || null;
        if(task === "transcription") output = data.choices?.[0]?.text || output;

        appendMessage("bot", output, task);
    }catch(err){
        console.error(err);
        appendMessage("bot","Error contacting API.");
    }

    userInput.value = "";
    fileUpload.value = "";
});

function appendMessage(sender,text,task="text"){
    const bubble = document.createElement("div");
    bubble.classList.add("bubble",sender);

    if(task==="code") bubble.innerHTML = `<pre><code>${text}</code></pre>`;
    else if(task==="image") bubble.innerHTML = `<img src="${text}" alt="AI Image">`;
    else if(task==="speech") bubble.innerHTML = `<audio controls src="${text}"></audio>`;
    else bubble.textContent = text;

    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function toBase64(file){
    return new Promise((resolve,reject)=>{
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = err => reject(err);
    });
}
