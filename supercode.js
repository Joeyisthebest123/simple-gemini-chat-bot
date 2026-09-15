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

const userHistory = localStorage.getItem('userHistory') ? JSON.parse(localStorage.getItem('userHistory')) : [];

instructionsInput.value = localStorage.getItem('instructions') || "balls in your court gemini. think smart and work well";
modelSelect.value = localStorage.getItem('model') || "gemini-3.5-flash-lite";

//when for is submited call run
form.addEventListener("submit", (event) => {
    event.preventDefault();
    input.disabled = true;

    run();
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


    //make new div for output
    const output = document.createElement("div");
    output.textContent = 'thinking... wait peon';
    outputBox.appendChild(output);

    try {
        //get ouput
        const response = await ai.models.generateContent({
            model: modelSelect.value,
            contents: userHistory,
            config: {
                systemInstruction: instructionsInput.value,
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
            parts: [{ text: response.text }]
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
}

