import { GoogleGenAI } from "https://esm.run/@google/genai";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";


let API_KEY = localStorage.getItem('apiKey') || 'API_KEY_HERE';

const chatScreen = document.querySelector('.screen-chat');
const settingsScreen = document.querySelector('.screen-settings');

const apiInput = document.getElementById("api-key-input");
const form = document.getElementById("input-form");
const outputBox = document.getElementById("output-box");
const input = document.getElementById("input");
const instructionsInput = document.getElementById("instructions-input");
const modelSelect = document.getElementById("model-select");
const settingsButton = document.getElementById("settings-button");
const chatButton = document.getElementById("chat-button");
const downloadBtn = document.getElementById('download-btn')
const uploadHistoryBtn = document.getElementById('upload-history-btn')

const userHistory = localStorage.getItem('userHistory') ? JSON.parse(localStorage.getItem('userHistory')) : [];

instructionsInput.value = localStorage.getItem('instructions') || "balls in your court gemini. think smart and work well";
modelSelect.value = localStorage.getItem('model') || "gemini-3.5-flash-lite";

const messages = [];
for (let i = 0; i < userHistory.length; i++){
    const message = document.createElement('div');
    message.classList.add('textBox');
    if(userHistory[userHistory.length - 1 - i].role == 'user'){
        message.classList.add('right-align');
    }else {
         message.classList.add('left-align');
    }
    // Safely pull from the end of the array backwards
    const historyItem = userHistory[userHistory.length - 1 - i];
    message.innerHTML = marked.parse(historyItem.parts[0].text);
    outputBox.append(message);
    MathJax.typesetPromise();
}




//when for is submited call run
form.addEventListener("submit", (event) => {
    event.preventDefault();
    input.disabled = true;

    run();
});

downloadBtn.addEventListener('click', () =>  {
    alert('hello');
    // 1. Convert the JSON array into a string format so the text file actually reads it
    const historyString = JSON.stringify(userHistory, null, 2);

    // 2. Pass the string inside an array to the Blob
    const historyBlob = new Blob([historyString], {type: "text/plain"});
    const url = URL.createObjectURL(historyBlob);

    // 3. Fix the quotes around 'a'
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neko Ai history.txt';

    // 4. Append to body, click, and clean up
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
});



settingsButton.addEventListener('click', () => {
    chatScreen.classList.toggle('unactive');
    settingsScreen.classList.toggle('unactive');
});

chatButton.addEventListener('click', () => {
    chatScreen.classList.toggle('unactive');
    settingsScreen.classList.toggle('unactive');
});

modelSelect.addEventListener("change", function () {
    localStorage.setItem('model', modelSelect.value);
});

apiInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      API_KEY = apiInput.value;
      apiInput.value = '';
      localStorage.setItem('apiKey', API_KEY);
    }
});

instructionsInput.addEventListener("keydown", function (event) {
    localStorage.setItem('instructions', instructionsInput.value);
     if (event.key === "Enter") {event.preventDefault();}
});

//check if enter is pressed and sumbit, stops new line
input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();  // Prevent newline
        form.dispatchEvent(new Event("submit"));  // Submit the form
    }
});
//if history gets too long remove oldest messages
function trimHistory() {
    if (userHistory.length > 100) {
        userHistory.splice(0, 2); // removes user and ai message
    }
}

async function run() {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const userInput = input.value.trim();
    if (!userInput) {
        input.disabled = false;
        return;  // Don't process empty input
    }
    //adding user message to history
    trimHistory();
    userHistory.push({
        role: 'user',
        parts: [{ text: userInput }]
    });

    const inputText = document.createElement("div");
    inputText.innerHTML = marked.parse(userInput);
    inputText.classList.add('textBox');
    inputText.classList.add('right-align');
    outputBox.prepend(inputText);


    //make new div for output
    const output = document.createElement("div");
    output.textContent = 'thinking... wait peon';
    output.classList.add('textBox');
    outputBox.prepend(output);

    try {
        //get ouput
        const response = await ai.models.generateContent({
            model: modelSelect.value,
            contents: userHistory,
            config: {
                systemInstruction: instructionsInput.value,
                tools: [{urlContext: {}}],
                safetySettings: [
                    {
                        category: 'HARM_CATEGORY_HARASSMENT',
                        threshold: 'BLOCK_NONE',
                    },
                    {
                        category: 'HARM_CATEGORY_HATE_SPEECH',
                        threshold: 'BLOCK_NONE',
                    },
                    {
                        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        threshold: 'BLOCK_NONE',
                    },
                    {
                        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold: 'BLOCK_NONE',
                    },
                ],
            }
        });

        //adding Ai message to history
        trimHistory();
        userHistory.push({
            role: 'model',
            parts: [{ text: response.text}]
        });

        // display response in output box
        output.innerHTML = marked.parse(response.text);
        form.reset();
    }
    catch (error) {
        console.error('Error:', error);
        output.textContent = error.message;
    }
    localStorage.setItem('userHistory', JSON.stringify(userHistory))
    input.disabled = false;

    MathJax.typesetPromise();

}


