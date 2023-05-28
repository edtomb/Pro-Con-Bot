/**
 * Get your API key from https://platform.openai.com/account/api-keys It will only be shared with openai.com.
 * You will be charged approximately $0.004 per request.
 */
const API_KEY = "enter your api key here"
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("add-pro-button").addEventListener("click", function() {
        handleInput("pro");
    });

    document.getElementById("add-con-button").addEventListener("click", function() {
        handleInput("con");
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
    const sysPrompt = `Given the pros and cons, provide two insights.`;
    const userPrompts = getUserPrompts(pros, cons);
    const response = await fetchOpenAICompletion(sysPrompt, userPrompts);

    document.getElementById("insights-text").value = response.choices.map(choice => choice.message.content.trim()).join("\n");
}

async function updateQuestions(pros, cons) {
    const sysPrompt = `Given the pros and cons, generate two questions.`;
    const userPrompts = getUserPrompts(pros, cons);
    const response = await fetchOpenAICompletion(sysPrompt, userPrompts);

    document.getElementById("questions-text").value = response.choices.map(choice => choice.message.content.trim()).join("\n");
}

function getUserPrompts(pros, cons) {
    const subject = document.getElementById("subject-entry").value;
    const prompts = pros.concat(cons).map(entry => `The following is an entry in a pro/con table about ${subject}: ${entry}`);
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
        model: "gpt-3.5-turbo",
        messages: messages,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
document.getElementById("reset-button").addEventListener("click", function(){
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
    document.getElementById("insights-text").value = "";
    document.getElementById("questions-text").value = "";
  });
  