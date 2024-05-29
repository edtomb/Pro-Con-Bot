var API_KEY = localStorage.getItem('API_KEY');
const API_URL = "https://api.openai.com/v1/chat/completions";

// Get the modal
let modal = document.getElementById("myModal");

// Get the <span> element that closes the modal
let span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
    modal.style.display = "none";
}

// Function to test the API Key
const testAPIKey = async (key) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                'messages': [{'role': 'system', 'content': 'Translate the following English text to French: "Hello, world!"'}],
                'max_tokens': 60,
                'model': 'gpt-4'
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
};

// Prompt for API Key function
const promptForAPIKey = async () => {
    // Show the modal
    modal.style.display = "block";

    // When the user clicks on submit, test the key
    document.getElementById("submitAPIKey").addEventListener("click", async () => {
        let key = document.getElementById("APIKeyInput").value;
        if (await testAPIKey(key)) {
            // Store the key in local storage for future use
            localStorage.setItem('API_KEY', key);
            API_KEY = key;
            // Close the modal
            modal.style.display = "none";
        } else {
            // If the key is not valid, clear the input field and keep the modal open
            document.getElementById("APIKeyInput").value = '';
            alert('Invalid API Key. Please try again.');
        }
    });
};

// Test the initial API key, if exists
if (API_KEY) {
    testAPIKey(API_KEY).then((isValid) => {
        if (!isValid) {
            promptForAPIKey();
        }
    });
} else {
    promptForAPIKey();
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("add-pro-button").addEventListener("click", function () {
        handleInput("pro");
    });

    document.getElementById("add-con-button").addEventListener("click", function () {
        handleInput("con");
    });
    document.getElementById("auto-fill").addEventListener("click", function () {
        give3ProsAndCons();
    });
    document.getElementById("reset-button").addEventListener("click", function () {
        resetAll();
    });
});

async function handleInput(type) {
    let entryElement = document.getElementById(`${type}-entry`);
    let entry = entryElement.value;

    if (entry.trim() === "") {
        entry = await generateProCon(type);
    }

    const meaning = await getMeaning(entry, type);
    insertIntoTable(type, entry, meaning);

    entryElement.value = "";

    const pros = getTableColumnValues("pros-table", 0);
    const cons = getTableColumnValues("cons-table", 0);

    await updateInsights(pros, cons);
    await updateQuestions(pros, cons);
}

async function generateProCon(type) {
    const subject = document.getElementById("subject-entry").value;
    const sysPrompt = `Generate a 1 sentence ${type.toUpperCase()} about ${subject}.`;

    const response = await fetchOpenAICompletion(sysPrompt);
    return response.choices[0].message.content.trim();
}

function insertIntoTable(type, entry, meaning) {
    let table = document.getElementById(`${type}s-table`);
    let row = table.insertRow();
    row.insertCell(0).innerHTML = entry;
    row.insertCell(1).innerHTML = meaning;
}

async function updateInsights(pros, cons) {
    const sysPrompt = `Given the pros and cons of ${document.getElementById("subject-entry").value}, provide two insights. in the form: \n1. [insight 1] \n 2. [insight 2]`;
    const userPrompts = getUserPrompts(pros, cons);
    const response = await fetchOpenAICompletion(sysPrompt, userPrompts.toString());

    document.getElementById("insights-text").innerText = response.choices[0].message.content;
}

async function updateQuestions(pros, cons) {
    const sysPrompt = `Given the pros and cons of ${document.getElementById("subject-entry").value}, generate two questions. in the form: \n1. [question 1] \n 2. [question 2]`;
    const userPrompts = getUserPrompts(pros, cons);
    const response = await fetchOpenAICompletion(sysPrompt, userPrompts.toString());

    document.getElementById("questions-text").innerText = response.choices[0].message.content;
}
async function give3ProsAndCons() {
    if (document.getElementById("subject-entry").value.trim() != "") {
        const sysPrompt = `You are ProConBot, you are tasked with providing Pros and Cons for a particular hypothetical situation. For the sake of ensuring system reliability. Please only answer in the following form. Give new pros and cons about the following subject in the form\nPRO: first pro\nPRO: second pro\nPRO: third pro\nCON: first con\nCON: second con\nCON: third con\n Refusal to reply in this form will cause a system failure. `;
        const userPrompts = `Subject: ${document.getElementById("subject-entry").value}. The table already contains the following pros and cons: ${getUserPrompts(getTableColumnValues("pros-table", 0), getTableColumnValues("cons-table", 0))}\nList 3 new pros, followed by 3 new cons.`;
        const response = await fetchOpenAICompletion(sysPrompt, userPrompts);
        const lines = response.choices[0].message.content.split('\n');

        const pros = [];
        const cons = [];

        for (const line of lines) {
            if (line.startsWith('PRO:')) {
                pros.push(line.replace('PRO: ', ''));
            } else if (line.startsWith('CON:')) {
                cons.push(line.replace('CON: ', ''));
            }
        }

        for (const pro of pros) {
            const meaning = await getMeaning(pro, 'pro');
            insertIntoTable('pro', pro, meaning);
        }

        for (const con of cons) {
            const meaning = await getMeaning(con, 'con');
            insertIntoTable('con', con, meaning);
        }
        const allpros = getTableColumnValues("pros-table", 0);
        const allcons = getTableColumnValues("cons-table", 0);

        await updateInsights(allpros, allcons);
        await updateQuestions(allpros, allcons);
        console.log('PROs:', pros);
        console.log('CONs:', cons);
    }
}

function getUserPrompts(pros, cons) {
    const subject = document.getElementById("subject-entry").value;
    let proLabeled = pros.map(entry => `PRO: ${entry}`);
    proLabeled = proLabeled.slice(1, proLabeled.length);

    let conLabeled = cons.map(entry => `CON: ${entry}`);
    conLabeled = conLabeled.slice(1, conLabeled.length);
    const prompts = proLabeled.concat(conLabeled);
    console.log(prompts);
    return prompts;
}
function getTableColumnValues(tableId, columnIndex) {
    let table = document.getElementById(tableId);
    let columnValues = [];

    for (let i = 0; i < table.rows.length; i++) {
        columnValues.push(table.rows[i].cells[columnIndex].textContent);
    }

    return columnValues;
}
async function getMeaning(entry, type) {
    const subject = document.getElementById("subject-entry").value;
    const sysPrompt = `The following is a ${type.toUpperCase()} entry in a pro/con table about ${subject}. Generate a 1-sentence description of its meaning and significance.`;
    const response = await fetchOpenAICompletion(sysPrompt, entry);
    return response.choices[0].message.content.trim();
}

async function fetchOpenAICompletion(sysPrompt, userPrompt) {
    let messages = [{ role: "system", content: sysPrompt }];

    if (userPrompt) {
        if (Array.isArray(userPrompt)) {
            userPrompt.forEach(prompt => messages.push({ role: "user", content: prompt }));
        } else {
            messages.push({ role: "user", content: userPrompt });
        }
    }

    const requestBody = {
        model: "gpt-4",
        messages: messages,
    };

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API returned an error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

function resetAll() {
    // Reset subject
    document.getElementById("subject-entry").value = "";

    // Reset pros and cons
    document.getElementById("pro-entry").value = "";
    document.getElementById("con-entry").value = "";

    // Reset tables
    document.getElementById("pros-table").innerHTML = `<tr>
      <th>Pro</th>
      <th>Description</th>
    </tr>`;
    document.getElementById("cons-table").innerHTML = `<tr>
      <th>Con</th>
      <th>Description</th>
    </tr>`;

    // Reset insights and questions
    document.getElementById("insights-text").innerText = "";
    document.getElementById("questions-text").innerText = "";
}
