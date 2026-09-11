import { GoogleGenAI } from "https://esm.run/@google/genai";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

let API_KEY = 'API_KEY_HERE'; // Replace with your actual API key

const apiInput = document.getElementById("api-key-input");
const form = document.getElementById("input-form");
const outputBox = document.getElementById("output-box");
const input = document.getElementById("input");
const userHistory = localStorage.getItem('userHistory') ? JSON.parse(localStorage.getItem('userHistory')) : [];

//when for is submited call run
form.addEventListener("submit", (event) => {
    event.preventDefault();
    input.disabled = true;

    run();
});
apiInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      API_KEY = apiInput.value;
      apiInput.value = '';
    }
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
            model: 'gemini-3.5-flash-lite',
            contents: userHistory,
            config: {
                systemInstruction: "talk like a cute cat girl. Be playful, flirty, and use cat-like expressions. Be very helpful and think about your responses",
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
