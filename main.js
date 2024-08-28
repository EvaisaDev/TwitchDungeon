
const elements = {
    inputField: 'input',
    outputDiv: 'output-story',
    outputLog: 'output-log',
    terminalDiv: 'main-container',
    menuToggle: 'menu-toggle',
    apiKeyInput: 'api-key-input',
    twitchChannelInput: 'twitch-channel',
    gptModelSelect: 'gpt-model-select',
    maxWords: 'max-words',
    toggleApiKey: 'toggle-api-key',
    streamerParticipates: 'take-turns',
    voteTime: 'vote-time',
    aiImages: 'ai-images',
    useTTS: 'use-tts',
    speakerbotAddress: 'speakerbot-address',
    speakerbotPort: 'speakerbot-port',
    narratorVoiceAlias: 'narrator-voice-alias'
};

// Initialize all elements
for (let key in elements) {
    elements[key] = document.getElementById(elements[key]);
}

const promptTemplate = `
You are a game master for a text based adventure game. you are completely fine with gore and violence, and you will not break the fourth wall.
As a game master, you can let players find items to add to their inventory, give them status effects, and describe the world around them.
In combat, you can let players attack, defend, or use items in their inventory. You can also let them run away or use special abilities.
If player's health reaches 0, they lose the game.
Only let players use items and abilities that they have found or learned. Do not let them use items or abilities that they do not have.
Note, you can use minecraft color codes to color important parts of your text. (make sure to put &f at the end of your colored text to reset the color to white)
Here is the list:
'&0': 'color:#000000',
'&1': 'color:#0000AA',
'&2': 'color:#00AA00',
'&3': 'color:#00AAAA',
'&4': 'color:#AA0000',
'&5': 'color:#AA00AA',
'&6': 'color:#FFAA00',
'&7': 'color:#AAAAAA',
'&8': 'color:#555555',
'&9': 'color:#5555FF',
'&a': 'color:#55FF55',
'&b': 'color:#55FFFF',
'&c': 'color:#FF5555',
'&d': 'color:#FF55FF',
'&e': 'color:#FFFF55',
'&f': 'color:#FFFFFF'
Make sure to type &f after you are done coloring your text to reset the color to white.
Example: "&4Redwood forest&f" will color the text "Redwood forest" red.
Do not let users just take control of the story by saying they find something, or by using items or abilities they do not have access to.
Do not format your text with markdown, this is not supported. Only use minecraft color codes.
Use minecraft color codes where-ever you can.
`;

let gptBasePrompt = promptTemplate;

// Function to load settings from local storage and apply them
function loadSetting(element, storageKey, defaultValue = '', isCheckbox = false) {
    const storedValue = localStorage.getItem(storageKey);
    if (storedValue !== null) {
        if (isCheckbox) {
            element.checked = storedValue === 'true';
        } else {
            element.value = storedValue;
        }
    } else {
        if (isCheckbox) {
            element.checked = defaultValue;
        } else {
            element.value = defaultValue;
        }
    }
    return storedValue || defaultValue;
}

// Function to save settings to local storage
function saveSetting(element, storageKey, isCheckbox = false) {
    const value = isCheckbox ? element.checked : element.value;
    localStorage.setItem(storageKey, value);
    return value;
}

// Load initial settings
loadSetting(elements.apiKeyInput, 'twitchdungeon-apiKey');
loadSetting(elements.twitchChannelInput, 'twitchdungeon-channel');
loadSetting(elements.streamerParticipates, 'twitchdungeon-streamer-participates', true, true);
loadSetting(elements.voteTime, 'twitchdungeon-vote-time', 30);
loadSetting(elements.aiImages, 'twitchdungeon-ai-images', false, true);
loadSetting(elements.useTTS, 'twitchdungeon-use-tts', false, true);
loadSetting(elements.speakerbotAddress, 'twitchdungeon-speakerbot-address', 'localhost');
loadSetting(elements.speakerbotPort, 'twitchdungeon-speakerbot-port', 7580);
loadSetting(elements.narratorVoiceAlias, 'twitchdungeon-narrator-voice-alias', '');
let maxWordsValue = loadSetting(elements.maxWords, 'twitchdungeon-max-words', 200);
gptBasePrompt += `The maximum word count for your responses is ${maxWordsValue}.`;

// Add event listeners for saving settings
elements.apiKeyInput.addEventListener('input', () => saveSetting(elements.apiKeyInput, 'twitchdungeon-apiKey'));
elements.twitchChannelInput.addEventListener('input', () => saveSetting(elements.twitchChannelInput, 'twitchdungeon-channel'));
elements.streamerParticipates.addEventListener('input', () => saveSetting(elements.streamerParticipates, 'twitchdungeon-streamer-participates', true));
elements.voteTime.addEventListener('input', () => saveSetting(elements.voteTime, 'twitchdungeon-vote-time'));
elements.aiImages.addEventListener('input', () => saveSetting(elements.aiImages, 'twitchdungeon-ai-images', true));
elements.useTTS.addEventListener('input', () => saveSetting(elements.useTTS, 'twitchdungeon-use-tts', true));
elements.speakerbotAddress.addEventListener('input', () => saveSetting(elements.speakerbotAddress, 'twitchdungeon-speakerbot-address'));
elements.speakerbotPort.addEventListener('input', () => saveSetting(elements.speakerbotPort, 'twitchdungeon-speakerbot-port'));
elements.narratorVoiceAlias.addEventListener('input', () => saveSetting(elements.narratorVoiceAlias, 'twitchdungeon-narrator-voice-alias'));
elements.maxWords.addEventListener('input', () => {
    maxWordsValue = saveSetting(elements.maxWords, 'twitchdungeon-max-words');
    gptBasePrompt = promptTemplate + `The maximum word count for your responses is ${maxWordsValue}.`;
});


let gameDataTemplate = {
    state: "none",
    theme: "fantasy",
    characters: {
        player: {
            description: "",
            name: "Player",
            inventory: [],
            status_effects: [],
            abilities: [],
            health: 5,
            max_health: 5,
            gold: 0,
            stats: {
                strength: 0,
                dexterity: 0,
                intelligence: 0,
                charisma: 0,
                wisdom: 0,
                constitution: 0,
            }
        },
        twitch_chat: {
            description: "",
            name: "Twitch Chat",
            inventory: [],
            status_effects: [],
            abilities: [],
            health: 5,
            max_health: 5,
            gold: 0,
            stats: {
                strength: 0,
                dexterity: 0,
                intelligence: 0,
                charisma: 0,
                wisdom: 0,
                constitution: 0,
            }
        },
    },
    viewerCharacterSelectionFlow: [],
    viewerCharacterSelectionState: 0,
    history: [],
    terminalPrints: [],
    logPrints: [],
}

let gameData = JSON.parse(JSON.stringify(gameDataTemplate))


let maximumHistory = 50
let activeVote = null
let viewerVotes = []
let activeVoteEntry = null
let voteSave_entry = null
let timeLeft = 0
let apiKeyVisible = false;


function ResetGame(){
    gameData = JSON.parse(JSON.stringify(gameDataTemplate))
    clear()
    activeVote = null
    viewerVotes = []
    activeVoteEntry = null  
    timeLeft = 0
    toggleInput(true)
    checkSettings()
}

    


function AddToHistory(content, role){
    gameData.history.push({content: content, role: role})
    if(gameData.history.length > maximumHistory){
        gameData.history.shift()
    }
}

const saveSlotString = "twitchdungeon-saves"


function SaveGame(saveName){
    
    let saves = JSON.parse(localStorage.getItem(saveSlotString)) || []
    let saveKey = `${saveSlotString}-${saveName}`
    localStorage.setItem(saveKey, JSON.stringify(gameData))

    if(!saves.includes(saveName)){
        saves.push(saveName)
    }

    localStorage.setItem(saveSlotString, JSON.stringify(saves))
    
    const outputLine = document.createElement('div');
    outputLine.innerHTML = `Game saved as ${saveName}.`;
    elements.outputLog.appendChild(outputLine);

}

function LoadGame(saveName){
    let saveKey = `${saveSlotString}-${saveName}`
    let saveData = JSON.parse(localStorage.getItem(saveKey))
    
    clear()

    if(saveData){
        gameData = saveData

        console.log(gameData)

        // restore terminal and log prints
        gameData.terminalPrints.forEach(print => {
            writeToTerminal(print.text, true)
        })

        gameData.logPrints.forEach(print => {
            writeToLog(print.text, true)
        })

        const outputLine = document.createElement('div');
        outputLine.innerHTML = `Game loaded from ${saveName}.`;
        elements.outputLog.appendChild(outputLine);

        
    }else{

        const outputLine = document.createElement('div');
        outputLine.innerHTML = `No save data found.`;
        elements.outputLog.appendChild(outputLine);

    }
}

function DeleteSave(saveName){
    let saveKey = `${saveSlotString}-${saveName}`
    localStorage.removeItem(saveKey)

    let saves = JSON.parse(localStorage.getItem(saveSlotString)) || []
    let index = saves.indexOf(saveName)
    if(index > -1){
        saves.splice(index, 1)
    }

    localStorage.setItem(saveSlotString, JSON.stringify(saves))

    const outputLine = document.createElement('div');
    outputLine.innerHTML = `Save ${saveName} deleted.`;
    elements.outputLog.appendChild(outputLine);


}

function GetSaveList(){
    let saves = JSON.parse(localStorage.getItem(saveSlotString)) || []
    return saves
}




async function GenerateVoteMessage(){
    if(activeVoteEntry){
        let output = ""
        activeVote.forEach((option, index) => {
            output += `${index + 1}) [${option.votes}] ${option.text}&f\n`
        });
        output += `Vote by typing the number of your choice. You have ${timeLeft} seconds left to vote.`
        activeVoteEntry.innerHTML = parseMinecraftColorCodes(output)

        // update votee save entry
        voteSave_entry.text = output
    }else{
        let output = ""
        activeVote.forEach((option, index) => {
            TryToSpeak(`${index + 1}. ${option.text}&f\n`)
            output += `${index + 1}) ${option.text}&f\n`
        });
        output += `Vote by typing the number of your choice. You have ${timeLeft} seconds left to vote.`
        let [activeVoteEntryOrig, voteSave_entryOrig] = writeToTerminal(output, true)

        activeVoteEntry = activeVoteEntryOrig
        voteSave_entry = voteSave_entryOrig
    }
}


function parseTwitchMessage(message) {
    const parsedMessage = {};

    // Extract tags, if any
    if (message.startsWith('@')) {
        const endOfTags = message.indexOf(' ');
        const tagsPart = message.slice(1, endOfTags);
        parsedMessage.tags = parseTags(tagsPart);
        message = message.slice(endOfTags + 1);
    }

    // Extract prefix (user info)
    if (message.startsWith(':')) {
        const endOfPrefix = message.indexOf(' ');
        parsedMessage.prefix = message.slice(1, endOfPrefix);
        message = message.slice(endOfPrefix + 1);
    }

    // Extract command
    const commandEndIndex = message.indexOf(' ');
    if (commandEndIndex === -1) {
        parsedMessage.command = message;
        return parsedMessage;
    }

    parsedMessage.command = message.slice(0, commandEndIndex);
    message = message.slice(commandEndIndex + 1);

    // Extract parameters
    if (message.startsWith(':')) {
        parsedMessage.params = [message.slice(1)];
    } else {
        const params = message.split(' :');
        parsedMessage.params = params[0].split(' ');

        if (params.length > 1) {
            parsedMessage.params.push(params[1]);
        }
    }

    return parsedMessage;
}

function parseTags(tagsString) {
    const tags = {};
    const tagPairs = tagsString.split(';');

    tagPairs.forEach(tagPair => {
        const [key, value] = tagPair.split('=');
        tags[key] = value || true;
    });

    return tags;
}



async function StartTwitchVote(options, duration, finishCallback){

    activeVote = null
    viewerVotes = []
    activeVoteEntry = null
    timeLeft = 0

    // disable input
    toggleInput(false)
    // clear previous vote
    viewerVotes = []
    activeVoteEntry = null
    activeVote = options
    activeVote.forEach(option => {
        option.votes = 0
    });
    GenerateVoteMessage()
    timeLeft = duration
    setTimeout(() => {
        // select random winner first
        let winner = activeVote[Math.floor(Math.random() * activeVote.length)]

        activeVote.forEach(option => {
            if(option.votes > winner.votes){
                winner = option
            }
        });
        viewerVotes = []
        activeVoteEntry = null
        timeLeft = 0
        activeVote = null
        toggleInput(true)
        finishCallback(winner)
    }, duration * 1000 + 1000)

    // run a timer to update the vote message every second
    let timer = setInterval(() => {
        timeLeft--
        if(timeLeft <= 0){
            clearInterval(timer)
        }
        GenerateVoteMessage()
    }, 1000)
}

function imageToMinecraftAscii(ctx, width, height, outputWidth, output) {
    // Minecraft color codes mapping
    const minecraftColors = {
        '&0': '#000000',
        '&1': '#0000AA',
        '&2': '#00AA00',
        '&3': '#00AAAA',
        '&4': '#AA0000',
        '&5': '#AA00AA',
        '&6': '#FFAA00',
        '&7': '#AAAAAA',
        '&8': '#555555',
        '&9': '#5555FF',
        '&a': '#55FF55',
        '&b': '#55FFFF',
        '&c': '#FF5555',
        '&d': '#FF55FF',
        '&e': '#FFFF55',
        '&f': '#FFFFFF'
    };

    // ASCII characters based on brightness
    const asciiChars = ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.'];

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let ascii = '';

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * 4;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];

            const brightness = (r + g + b) / 3;
            const charIndex = Math.floor((brightness / 255) * (asciiChars.length - 1));
            const asciiChar = asciiChars[charIndex];

            const colorCode = getMinecraftColor(r, g, b);
            ascii += `${colorCode}${asciiChar}`;
        }
        ascii += '\n'; // New line for each row
    }

    return ascii;
}

function getMinecraftColor(r, g, b) {
    const minecraftColors = {
        '&0': '#000000',
        '&1': '#0000AA',
        '&2': '#00AA00',
        '&3': '#00AAAA',
        '&4': '#AA0000',
        '&5': '#AA00AA',
        '&6': '#FFAA00',
        '&7': '#AAAAAA',
        '&8': '#555555',
        '&9': '#5555FF',
        '&a': '#55FF55',
        '&b': '#55FFFF',
        '&c': '#FF5555',
        '&d': '#FF55FF',
        '&e': '#FFFF55',
        '&f': '#FFFFFF'
    };

    let closestCode = '&0';
    let closestDistance = Infinity;

    for (let code in minecraftColors) {
        const hex = minecraftColors[code];
        const cr = parseInt(hex.slice(1, 3), 16);
        const cg = parseInt(hex.slice(3, 5), 16);
        const cb = parseInt(hex.slice(5, 7), 16);

        const distance = Math.sqrt(Math.pow(cr - r, 2) + Math.pow(cg - g, 2) + Math.pow(cb - b, 2));

        if (distance < closestDistance) {
            closestDistance = distance;
            closestCode = code;
        }
    }

    return closestCode;
}


async function generateImage(prompt, callback){

    try{
        let summary = await asyncGenerateSummary(prompt)

        // json parse the summary
        let summaryData = JSON.parse(summary)

        prompt = summaryData.choices[0].message.content

        // generate an image using dall-e
        let endpoint = `v1/images/generations`
        const body = {
            model: "dall-e-2",
            prompt: `${prompt}, in a painted style fitting a pen & paper RPG artbook.`,
            size: "256x256",
            response_format: "b64_json",
            n: 1,
        };

        const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

        if (response.status === 200) {
            // read whole stream and get the image.
            let image = ""
            HandleStream(response.body, async(text) => {
                image += text
            }, () => {
                // parse json
                try {
                    let content = JSON.parse(image)

                    let imageb64 = content.data[0].b64_json;
                    
                    let img = new Image();
                    img.src = 'data:image/png;base64,' + imageb64;
                    img.onload = function() {
                        
                        // resize the image to 32x32
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = 32;
                        canvas.height = 32;
                        ctx.drawImage(img, 0, 0, 32, 32);

                        // add image to output
                        const imageDiv = document.createElement('div');
                        imageDiv.classList.add('image');
                        imageDiv.appendChild(img);
                        elements.outputDiv.appendChild(imageDiv);
                        // Scroll to the bottom of the terminal
                        elements.outputDiv.scrollTop = elements.outputDiv.scrollHeight;

                        if(callback){
                            callback()
                        }
                    };

                } catch (error) {
                    console.log(error)
                    if(callback){
                        callback()
                    }

                }
                
            
            });
        }else{
            console.log(response)
            if(callback){
                callback()
            }
        }
    }catch(error){

        console.log(error)
        if(callback){
            callback()
        }
    }

}

async function asyncGenerateImage(prompt){
    return new Promise((resolve, reject) => {
        generateImage(prompt, () => {
            resolve()
        })
    })
}

async function asyncGenerateSummary(text){
    return new Promise(async (resolve, reject) => {
        // generate a small summary of the scene in the text
        // we will turn this into an image generation prompt
        // keep it 50 words or less
        let endpoint = `v1/chat/completions`
        let prompt = `You will be given a part of a story, compress the story to a brief summary of the scene, keep it to 25 - 50 words. Only describe the scene, Do not add anything that directly speaks to the player, Do not add additional story elements.
        Example:
        Text: "You find yourself in a lush green clearing surrounded by towering ancient oaks that sway gently in the warm breeze. The smell of damp earth fills the air, mixed with the sweet aroma of blooming wildflowers scattered across the ground. A small, shimmering brook weaves its way through the clearing, its water sparkling under the golden rays of the sun.However, there's an unsettling tension in the atmosphere. Whispers of distant creatures can be heard, and shadows flit among the trees. The ground beneath your feet feels unstable, as if it might reveal secrets buried long ago.In the center of the clearing, there is a strange altar made of smooth stones, adorned with faintly glowing runes that pulse with an unknown energy. It seems to beckon you closer, promising mystical potential or perilous danger.

Before proceeding into this intriguing yet eerie setting, it's time to focus on your journey. Please take a moment to describe your character, including their race, appearance, and any unique traits or abilities they might possess."
        Output: "In a lush clearing with an eerie tension, a stone altar with glowing runes hints at danger or mystical opportunity amidst ancient oaks."
        `
        const body = {
            model: elements.gptModelSelect.value || 'gpt-4o-mini',
            messages: [{role: 'system', content: prompt}, {role: "user", content: text}],
            max_tokens: 100
        };
        
        const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

        if (response.status === 200) {
            let output = "";
            HandleStream(response.body, (text) => {
                output += text
            }, () => {
                resolve(output)
            });
        }else{
            console.log(response)
            reject()
        }
    })
}



async function ConnectToTwitch(){
    // connect to twitch irc anonymously using websockets
    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    ws.onopen = function open() {
        ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
        ws.send('PASS SCHMOOPIIE');
        ws.send('NICK justinfan12345');
        ws.send('JOIN #' + elements.twitchChannelInput.value);

        // ping 
    };

    ws.onmessage = function incoming(event) {
        const message = event.data;
        const parsedMessage = parseTwitchMessage(message);
        if(parsedMessage.command == "PRIVMSG"){
            let username = parsedMessage.prefix.split("!")[0]
            let message = parsedMessage.params[1]

            // check if a vote is active
            if(activeVote){
                // check if the message starts with a number and that the user has not voted yet
                if(!viewerVotes.includes(username)){
                    let vote = parseInt(message)
                    if(vote && vote > 0 && vote <= activeVote.length){
                        activeVote[vote - 1].votes++
                        viewerVotes.push(username)
                    }
                }
            }

        }

        // respond to pings
        if (parsedMessage.command === 'PING') {
            ws.send('PONG :tmi.twitch.tv');
            ws.send('PONG :tmi.twitch.tv\r\n');
            console.log('PONG :tmi.twitch.tv');
        }

        
    };

    ws.onerror = function error(event) {
        console.log(event)
    }
}

let speakerbot = null

async function ConnectToSpeakerbot(){
    // check if speakerbot is defined and open
    if(speakerbot && speakerbot.readyState == WebSocket.OPEN){
        return
    }

    // connect to speakerbot using websockets
    const ws = new WebSocket(`ws://${elements.speakerbotAddress.value}:${elements.speakerbotPort.value}`);
    ws.onopen = function open() {
        speakerbot = ws
    };

    ws.onmessage = function incoming(event) {
    }

    ws.onerror = function error(event) {
        console.log(event)
    }
}

async function TryToSpeak(text){
    if (!elements.useTTS.checked) {
        return;
    }
    /*
    {
    "id": "<id>",
    "request": "Speak",
    "voice": "EventVoice",
    "message": "This is a test message",
    "badWordFilter": true
    }
    */

    text = cleanText(text)

    // split text by sentence endings and send each sentence to speakerbot
    let sentences = text.split(/(?<=[.!?])\s+/)
    sentences.forEach(sentence => {
        // remove any line ending characters and new lines
        sentence = sentence.replace(/[\r\n]+/gm, " ")
        sentence = sentence.trim()
        sentence = sentence.replace(/[.!?]+/g, "")

        if(speakerbot && speakerbot.readyState == WebSocket.OPEN){
            speakerbot.send(JSON.stringify({id: "1", request: "Speak", voice: elements.narratorVoiceAlias.value, message: sentence.trim(), badWordFilter: true}))
        }else if(!speakerbot || speakerbot.readyState == WebSocket.CLOSED || speakerbot.readyState == WebSocket.CLOSING){
            ConnectToSpeakerbot()
        }
    });

}

function writeToLog(text, skipSpeaking = false) {

    let entry = {text: text}
    // add to log prints
    gameData.logPrints.push(entry)

    // make sure we only have 50 prints in the log
    if(gameData.logPrints.length > maximumHistory){
        gameData.logPrints.shift()
    }

    const outputLine = document.createElement('div');
    outputLine.innerHTML = parseMinecraftColorCodes(text);
    elements.outputLog.appendChild(outputLine);

    // make sure we only have 50 children in the log
    if(elements.outputLog.children.length > maximumHistory){
        elements.outputLog.removeChild(elements.outputLog.children[0])
    }

    // Scroll to the bottom of the terminal
    elements.outputLog.scrollTop = elements.outputLog.scrollHeight;

    if(!skipSpeaking){
        TryToSpeak(text)
    }

    return [outputLine, entry]
}

function writeToTerminal(text, skipSpeaking = false) {
    let entry = {text: text}
    // add to terminal prints
    gameData.terminalPrints.push(entry)


    // make sure we only have 50 prints in the terminal
    if(gameData.terminalPrints.length > maximumHistory){
        gameData.terminalPrints.shift()
    }

    const outputLine = document.createElement('div');
    outputLine.innerHTML = parseMinecraftColorCodes(text);
    elements.outputDiv.appendChild(outputLine);

    // make sure we only have 50 children in the terminal
    if(elements.outputDiv.children.length > maximumHistory){
        elements.outputDiv.removeChild(elements.outputDiv.children[0])
    }

    // Scroll to the bottom of the terminal
    elements.outputDiv.scrollTop = elements.outputDiv.scrollHeight;

    if(!skipSpeaking){
        TryToSpeak(text)
    }

    return [outputLine, entry]
}


function clear() {
    elements.outputDiv.innerHTML = '';
    elements.outputDiv.scrollTop = elements.outputDiv.scrollHeight;
    elements.outputLog.innerHTML = '';
    elements.outputLog.scrollTop = elements.outputLog.scrollHeight;
}

async function HandleStream(stream, callback, done) {
    const reader = stream.getReader();
    const chunks = [];
    
    let finished = false;
    while (!finished) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) {
            finished = true;
        }
        if (value) {
            const text = new TextDecoder().decode(value);
            chunks.push(text);
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                callback(lines[i]);
            }
        }
    }

    if (finished) {
        done();
    }
}

let continueCallback = null

function toggleInput(enabled, newPlaceholder = null) {
    elements.inputField.disabled = !enabled;
    elements.inputField.placeholder = enabled ? '' : 'Waiting for API response...';
    if(continueCallback != null){
        elements.inputField.placeholder = 'Press any key to continue...';
    }
    if(newPlaceholder){
        elements.inputField.placeholder = newPlaceholder
    }
}

function GPTRequest(endpoint, apiKey, body) {
    return fetch(`https://api.openai.com/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });
}




elements.toggleApiKey.addEventListener('click', () => {
    apiKeyVisible = !apiKeyVisible;
    if (!apiKeyVisible) {
        elements.apiKeyInput.type = 'password';
        elements.toggleApiKey.classList.remove('fa-eye');
        elements.toggleApiKey.classList.add('fa-eye-slash');
    } else {
        elements.apiKeyInput.type = 'text';
        elements.toggleApiKey.classList.remove('fa-eye-slash');
        elements.toggleApiKey.classList.add('fa-eye');
    }
});

/*elements.terminalDiv.addEventListener('click', () => {
    elements.inputField.focus();
});*/

elements.inputField.addEventListener('keydown', function(event) {
    if(continueCallback){
        // if any key is pressed, call the continue callback

        // clear the input field
        elements.inputField.value = ''
        toggleInput(false)
        // clear again after 1 second
        setTimeout(() => {
            elements.inputField.value = ''
            continueCallback()
            continueCallback = null
            elements.inputField.placeholder = ''
        }, 100)
        return
    }
    if (event.key === 'Enter') {
        const command = elements.inputField.value;
        elements.inputField.value = ''; // Clear input field
        // Create a new line with the command and append it to the output
        const commandLine = document.createElement('div');
        commandLine.innerHTML = `> ${parseMinecraftColorCodes(command)}`;
        elements.outputDiv.scrollTop = elements.outputDiv.scrollHeight;
        elements.outputDiv.appendChild(commandLine);
        // Execute the command (simulate execution)
        executeCommand(command);
    }
});

async function waitForKeypress(callback){
    continueCallback = callback
    toggleInput(true)
}

async function checkSettings() {
    if (!elements.apiKeyInput.value) {
        writeToTerminal('Please enter your OpenAI API key in the sidebar menu, then type "start" to begin.', true);
        return false
    }else{
        // make a tiny api request to check if the api key is valid
        const model = elements.gptModelSelect.value || 'gpt-4o-mini';

        let endpoint = `v1/chat/completions`
        // send gpt chat request and stream the response to the terminal, every time we receive a chunk
        const body = {
            model: model,
            messages: [{role: 'system', content: 'You are a helpful assistant.'}, {role: 'user', content: "hello!"}],
            max_tokens: 20
        };

        const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

        if (response.status === 200) {
            // clear the terminal
            clear();
            writeToTerminal("Welcome adventurer, please choose a theme for your adventure: ")
            gameData.state = "theme"
            ConnectToSpeakerbot()
            // if twitch channel is set, connect to twitch
            if(elements.twitchChannelInput.value && elements.twitchChannelInput.value.length > 0){
                ConnectToTwitch()
            }
            return true;
        } else {
            writeToTerminal('Your API key is invalid, does not have access to the model, or you have exceeded your quota. Please update your API key then type "start" to begin.');
            return false;
        }
        
    }
}

async function checkForChanges(text, isViewer, callback){
    // have the AI determine if there are any items or status effects gained or lost in the text. 
    // use a json schema to make sure the AI response is in the correct format
    let endpoint = `v1/chat/completions`
    let prompt = gptBasePrompt + `You are determining if the player has gained or lost any items, status effects, abilities, stats, gold, or health, based on the provided text. Please provide a list of items or status effects gained or lost, and if they were gained or lost. Do not add additional story info. Give your response in the form of a json object.
    Examples for the JSON:
    text: "You find a &6sword&f on the ground."
    Output: {"items": [{"name": "&6sword&f", "description": "A trusty iron sword" "action": "gained"}]}
    text: "You decide to eat the &2apple&f, it tastes delicious. You are now &5poisoned&f."
    Output: {"items": [{"name": "&2apple$f", "description":"A tasty looking apple." "action": "lost"}], "status_effects": [{"name": "&5poisoned&f", "description": "&4You do not feel so good&f" "action": "gained"}]}
    text: "Your &6sword&f broke",
    Output: {"items": [{"name": "&6sword$f", "description":"A trusty iron sword" "action": "lost"}]}
    text: "You drank a healing potion and gained 5 health points."
    Output: {"health": 5}
    text: "You got hit by a fireball and lost 3 health points."
    Output: {"health": -3}
    text: "You learned a new ability, &2Fireball&f."
    Output: {"abilities": [{"name": "&2Fireball&f", "description": "A powerful fire spell" "action": "gained"}]}
    text: "You trained your soul and gained 1 max hp."
    Output: {"max_health": 1}
    text: "You feel weaker and lost 1 max hp."
    Output: {"max_health": -1}
    text: "You feel stronger and gained 1 strength."
    Output: {"stats": {"strength": 1}}
    text: "You feel weaker and lost 1 strength."
    Output: {"stats": {"strength": -1}}
    text: "Whiskers approaches the bartender, bowl of milk drained, and inquires"
    Output: {"items": [{"name": "a bowl of milk", "description": "A bowl of milk" "action": "lost"}]}
    text: "You approach the shopkeeper and buy a new sword."
    Output: {"items": [{"name": "a new sword", "description": "A shiny new sword" "action": "gained"}], "gold": -5}
    text: "You find a chest with 10 gold coins."
    Output: {"gold": 10}

    Note: If the story says the player finds something, but they have not picked it up yet, do not add it to the inventory. Same goes for anything that requires an action from the player first.
    Make sure stuff is formatted the exact same way as it is in the player's info
    `

    const body = {
        model: elements.gptModelSelect.value || 'gpt-4o-mini',
        messages: [{role: 'system', content: prompt}, {role: 'user', content: GetPlayerCharacterInfo(isViewer)}, {role: 'user', content: text}],
        response_format: {
            type: "json_object",
        },
    };

    const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

    if (response.status === 200) {
        let output = "";

        let json = ""
        HandleStream(response.body, (text) => {
            json += text
        }, () => {
            try{
                console.log(json)
                // parse json
                let content = JSON.parse(json)
                let data = JSON.parse(content.choices[0].message.content)



                let items = data.items || []
                let statusEffects = data.status_effects || []
                let health = data.health || 0
                let max_health = data.max_health || 0
                let abilities = data.abilities || []
                let stats = data.stats || {}
                let gold = data.gold || 0

                items.forEach(item => {
                    item.name = cleanText(item.name)
                    if(item.action == "gained"){
                        if(isViewer){
                            gameData.characters.twitch_chat.inventory.push({name: item.name, description: item.description})
                            writeToLog(`${gameData.characters.twitch_chat.name} has gained a ${item.name} - ${item.description}`, true)
                        }else{
                            gameData.characters.player.inventory.push({name: item.name, description: item.description})
                            writeToLog(`${gameData.characters.player.name} has gained a ${item.name} - ${item.description}.`, true)
                        }
                    }else if(item.action == "lost"){
                        if(isViewer){
                            gameData.characters.twitch_chat.inventory = gameData.characters.twitch_chat.inventory.filter(i => i != item.name)
                            writeToLog(`${gameData.characters.twitch_chat.name} has lost a ${item.name} - ${item.description}.`, true)
                        }else{
                            gameData.characters.player.inventory = gameData.characters.player.inventory.filter(i => i != item.name)
                            writeToLog(`${gameData.characters.player.name} has lost a ${item.name} - ${item.description}.`, true)
                        }
                    }
                });

                statusEffects.forEach(statusEffect => {
                    statusEffect.name = cleanText(statusEffect.name)
                    if(statusEffect.action == "gained"){
                        if(isViewer){
                            gameData.characters.twitch_chat.status_effects.push({name: statusEffect.name, description: statusEffect.description})
                            writeToLog(`${gameData.characters.twitch_chat.name} gained status effect ${statusEffect.name} - ${statusEffect.description}.`, true)
                        }else{
                            gameData.characters.player.status_effects.push({name: statusEffect.name, description: statusEffect.description})
                            writeToLog(`${gameData.characters.player.name} gained status effect ${statusEffect.name} - ${statusEffect.description}.`, true)
                        }
                    }else if(statusEffect.action == "lost"){
                        if(isViewer){
                            gameData.characters.twitch_chat.status_effects = gameData.characters.twitch_chat.status_effects.filter(i => i != statusEffect.name)
                            writeToLog(`${gameData.characters.twitch_chat.name} lost status effect ${statusEffect.name}.`, true)
                        }else{
                            gameData.characters.player.status_effects = gameData.characters.player.status_effects.filter(i => i != statusEffect.name)
                            writeToLog(`${gameData.characters.player.name} lost status effect ${statusEffect.name}.`, true)
                        }
                    }
                });

                if(health != 0){
                    if(isViewer){
                        gameData.characters.twitch_chat.health += health
                        Math.min(gameData.characters.twitch_chat.health, gameData.characters.twitch_chat.max_health)
                        writeToLog(`${gameData.characters.twitch_chat.name} ${health > 0 ? "gained" : "lost"} ${Math.abs(health)} health points.`, true)

                        if(gameData.characters.twitch_chat.health <= 0){
                            writeToTerminal("-------------------------", true)
                            writeToTerminal(`${gameData.characters.twitch_chat.name} has died. Game over.`)
                            writeToTerminal("You can start a new game by refreshing the page, or pressing the reset button in the save menu.", true)
                            gameData.state = "none"
                            gameData.died = true
                            toggleInput(false, "Game Over")
                        }
                    }else{
                        gameData.characters.player.health += health
                        Math.min(gameData.characters.player.health, gameData.characters.player.max_health)
                        writeToLog(`${gameData.characters.player.name} ${health > 0 ? "gained" : "lost"} ${Math.abs(health)} health points.`)

                        if(gameData.characters.player.health <= 0){
                            writeToTerminal("-------------------------", true)
                            writeToTerminal(`${gameData.characters.player.name} has died. Game over.`)
                            writeToTerminal("You can start a new game by refreshing the page, or pressing the reset button in the save menu.", true)
                            gameData.state = "none"
                            gameData.died = true
                            toggleInput(false, "Game Over")
                        }
                    }
                }

                if(max_health != 0){
                    if(isViewer){
                        gameData.characters.twitch_chat.max_health += max_health
                        writeToLog(`${gameData.characters.twitch_chat.name} ${max_health > 0 ? "gained" : "lost"} ${Math.abs(max_health)} max health points.`, true)

                        // make sure health does not exceed max health
                        gameData.characters.twitch_chat.health = Math.min(gameData.characters.twitch_chat.health, gameData.characters.twitch_chat.max_health)

                        // if health is 0, the player dies
                        if(gameData.characters.twitch_chat.health <= 0){
                            writeToTerminal("-------------------------", true)
                            writeToTerminal(`${gameData.characters.twitch_chat.name} has died. Game over.`)
                            writeToTerminal("You can start a new game by refreshing the page, or pressing the reset button in the save menu.", true)
                            gameData.state = "none"
                            gameData.died = true
                            toggleInput(false, "Game Over")
                        }
                    }else{
                        gameData.characters.player.max_health += max_health
                        writeToLog(`${gameData.characters.player.name} ${max_health > 0 ? "gained" : "lost"} ${Math.abs(max_health)} max health points.`, true)

                        // make sure health does not exceed max health
                        gameData.characters.player.health = Math.min(gameData.characters.player.health, gameData.characters.player.max_health)

                        // if health is 0, the player dies
                        if(gameData.characters.player.health <= 0){
                            writeToTerminal("-------------------------", true)
                            writeToTerminal(`${gameData.characters.player.name} has died. Game over.`)
                            writeToTerminal("You can start a new game by refreshing the page, or pressing the reset button in the save menu.", true)
                            gameData.state = "none"
                            gameData.died = true
                            toggleInput(false, "Game Over")
                        }
                    }
                }

                if(gold != 0){
                    if(isViewer){
                        gameData.characters.twitch_chat.gold += gold

                        gameData.characters.twitch_chat.gold = Math.max(gameData.characters.twitch_chat.gold, 0)
                        writeToLog(`${gameData.characters.twitch_chat.name} &6${gold > 0 ? "gained" : "lost"} ${Math.abs(gold)} gold.&f`, true)
                    }else{
                        gameData.characters.player.gold += gold

                        gameData.characters.player.gold = Math.max(gameData.characters.player.gold, 0)
                        
                        writeToLog(`${gameData.characters.player.name} &6${gold > 0 ? "gained" : "lost"} ${Math.abs(gold)} gold.&f`, true)
                    }
                }

                // make sure stats is a valid object
                if(stats && typeof stats == "object"){
                    for (const [key, value] of Object.entries(stats)) {
                        key = cleanText(key)
                        // check if stat value is not 0
                        if (value != 0) {

                            if(isViewer){
                                // check if the stat exists, if not, create it
                                if(!gameData.characters.twitch_chat.stats[key]){
                                    gameData.characters.twitch_chat.stats[key] = 0
                                }
                                gameData.characters.twitch_chat.stats[key] += value
                                writeToLog(`${gameData.characters.twitch_chat.name} ${value > 0 ? "gained" : "lost"} ${Math.abs(value)} ${key}.`, true)
                            }else{
                                // check if the stat exists, if not, create it
                                if(!gameData.characters.player.stats[key]){
                                    gameData.characters.player.stats[key] = 0
                                }
                                gameData.characters.player.stats[key] += value
                                writeToLog(`${gameData.characters.player.name} ${value > 0 ? "gained" : "lost"} ${Math.abs(value)} ${key}.`, true)
                            }
                        }
                    }
                }
                    


                abilities.forEach(ability => {
                    ability.name = cleanText(ability.name)
                    if(ability.action == "gained"){
                        if(isViewer){
                            gameData.characters.twitch_chat.abilities.push({name: ability.name, description: ability.description})
                            writeToLog(`${gameData.characters.twitch_chat.name} gained a new ability, ${ability.name} - ${ability.description}.`, true)
                        }else{
                            gameData.characters.player.abilities.push({name: ability.name, description: ability.description})
                            writeToLog(`${gameData.characters.player.name} gained a new ability, ${ability.name} - ${ability.description}.`, true)
                        }
                    }else if(ability.action == "lost"){
                        if(isViewer){
                            gameData.characters.twitch_chat.abilities = gameData.characters.twitch_chat.abilities.filter(i => i != ability.name)
                            writeToLog(`${gameData.characters.twitch_chat.name} lost the ability ${ability.name}.`, true)
                        }else{
                            gameData.characters.player.abilities = gameData.characters.player.abilities.filter(i => i != ability.name)
                            writeToLog(`${gameData.characters.player.name} lost the ability ${ability.name}.`, true)
                        }
                    }
                });

                if(callback){
                    callback()
                }
            }catch(error){
                if(callback){
                    callback()
                }
            }
        });
    }
    else {
        if(callback){
            callback()
        }
    }
}

async function checkForChangesAsync(text, isViewer){
    return new Promise((resolve, reject) => {
        try{
            checkForChanges(text, isViewer, () => {
                resolve()
            })
        }catch(error){
            reject()
        }
    })
}




function GetPlayerCharacterInfo(isViewer){
    // return a string containing the player's character info, such as name, inventory, and status effects
    let info = ""
    if(isViewer){
        let name = gameData.characters.twitch_chat.name
        let description = gameData.characters.twitch_chat.description
        let health = gameData.characters.twitch_chat.health || 5
        let max_health = gameData.characters.twitch_chat.max_health || 5

        let stats = ""
        stats += `HP: ${health}/${max_health}\n`
        // loop through stats key value pairs
        for (const [key, value] of Object.entries(gameData.characters.twitch_chat.stats)) {
            stats += `${key}: ${value}\n`
        }

        let inventory = ""
        gameData.characters.twitch_chat.inventory.forEach(item => {
            inventory += `${item.name} - ${item.description}\n`
        });

        let gold = gameData.characters.twitch_chat.gold || 0

        if(gold > 0){
            inventory += `&6${gold} gold&f\n`
        }

        if(inventory.length == 0){
            inventory = "None"
        }

        let statusEffects = ""
        gameData.characters.twitch_chat.status_effects.forEach(statusEffect => {
            statusEffects += `${statusEffect.name} - ${statusEffect.description}\n`
        });
        if(statusEffects.length == 0){
            statusEffects = "None"
        }

        let abilities = ""
        gameData.characters.twitch_chat.abilities.forEach(ability => {
            abilities += `${ability.name} - ${ability.description}\n`
        });
        if(abilities.length == 0){
            abilities = "None"
        }

        info = `${name} - ${description}\n\nStats:\n${stats}\nInventory:\n${inventory}\nStatus Effects:\n${statusEffects}\n\nAbilities:\n${abilities}`

    }else{
        let name = gameData.characters.player.name
        let description = gameData.characters.player.description
        let health = gameData.characters.player.health || 5
        let max_health = gameData.characters.player.max_health || 5

        let stats = ""
        stats += `HP: ${health}/${max_health}\n`
        // loop through stats key value pairs
        for (const [key, value] of Object.entries(gameData.characters.player.stats)) {
            stats += `${key}: ${value}\n`
        }

        let gold = gameData.characters.player.gold || 0

        let inventory = ""
        gameData.characters.player.inventory.forEach(item => {
            inventory += `${item.name} - ${item.description}\n`
        });

        if (gold > 0) {
            inventory += `&6${gold} gold&f\n`
        }

        if(inventory.length == 0){
            inventory = "None"
        }

        let statusEffects = ""
        gameData.characters.player.status_effects.forEach(statusEffect => {
            statusEffects += `${statusEffect.name} - ${statusEffect.description}\n`
        });
        if(statusEffects.length == 0){
            statusEffects = "None"
        }

        let abilities = ""
        gameData.characters.player.abilities.forEach(ability => {
            abilities += `${ability.name} - ${ability.description}\n`
        });
        if(abilities.length == 0){
            abilities = "None"
        }

        info = `${name} - ${description}\n\nStats:\n${stats}\nInventory:\n${inventory}\nStatus Effects:\n${statusEffects}\n\nAbilities:\n${abilities}`

    }

    return info
}

async function compressAndAddToHistory(text, role){
    // ask the AI to compress the text to the most important parts, then add it to the gameData.history. make sure it keeps it to roughly 50 - 100 words.
    // make sure to use a promise to do so
    console.log("Compressing text: " + cleanText(text))
    return new Promise(async (resolve, reject) => {
        let endpoint = `v1/chat/completions`
        let prompt = `You will be given a part of a story, compress the story to a brief summary, make sure to keep key parts such a names, actions, and story info, keep it to roughly 50 - 100 words. Only summarize actual parts of the story, Do not add anything that directly speaks to the player, Do not add additional story elements.
        Example:
        Text: "You find yourself in a lush green clearing surrounded by towering ancient oaks that sway gently in the warm breeze. The smell of damp earth fills the air, mixed with the sweet aroma of blooming wildflowers scattered across the ground. A small, shimmering brook weaves its way through the clearing, its water sparkling under the golden rays of the sun.However, there's an unsettling tension in the atmosphere. Whispers of distant creatures can be heard, and shadows flit among the trees. The ground beneath your feet feels unstable, as if it might reveal secrets buried long ago.In the center of the clearing, there is a strange altar made of smooth stones, adorned with faintly glowing runes that pulse with an unknown energy. It seems to beckon you closer, promising mystical potential or perilous danger.

Before proceeding into this intriguing yet eerie setting, it's time to focus on your journey. Please take a moment to describe your character, including their race, appearance, and any unique traits or abilities they might possess."
        Output: "In a verdant clearing surrounded by ancient oaks, a shimmering brook flows under the sun's golden rays. The air is filled with the scent of damp earth and blooming wildflowers, but an unsettling tension pervades the atmosphere. Shadows move among the trees, and the ground feels unstable. At the clearing's center stands an altar made of smooth stones, adorned with glowing runes that pulse with mysterious energy, hinting at potential danger or mystical opportunity."
        `
        const body = {
            model: elements.gptModelSelect.value || 'gpt-4o-mini',
            messages: [{role: 'system', content: prompt}, {role: role, content: text}],
            max_tokens: 200
        };

        const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

        if (response.status === 200) {
            let output = "";
            HandleStream(response.body, (text) => {
                output += text
            }
            , () => {
                try {
                    // parse json
                    let data = JSON.parse(output)
                    let compressed = data.choices[0].message.content
                    // add the compressed text to the gameData.history
                    AddToHistory(compressed, role)
                    console.log("Added to history: " + compressed)
                    resolve()
                }   
                catch (error) {
                    console.log(error)
                    reject()
                }
            });
        }else{
            console.log(response)
            reject()
        }
    })
}

async function runGameLoop(){
    // if viewer turn, generate things they can vote to do next.
    if(gameData.state == "viewer_turn"){
        toggleInput(false)
        let endpoint = `v1/chat/completions`
        let prompt = gptBasePrompt + ` The theme of the game is ${gameData.theme}. You are generating vote options for the player's next move. Please provide 5 options for the player to choose from, keep these options under 25 words, do not add additional story info, ONLY reply with the options. Do not number the options.`
        const body = {
            model: elements.gptModelSelect.value || 'gpt-4o-mini',
            messages: [{role: 'system', content: prompt}, ...gameData.history, {role: 'user', content: "generate the options"}],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "vote_options",
                    schema: {
                        type: "object",
                        properties: {
                            options: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            }
                        },
                        required: ["options"],
                        additionalProperties: false
                    },
                    strict: true
                    
                },
            },
        };

        
        const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

        if (response.status === 200) {
            let output = "";

            console.log(response.body)

            let json = ""
            HandleStream(response.body, (text) => {
                json += text
            }, () => {
                // parse json
                let data = JSON.parse(json)
                let options = JSON.parse(data.choices[0].message.content);

                let voteOptions = []
                options.options.forEach(option => {
                    // if option starts with a numbering, remove it
                    // such as 1. Go North
                    option = option.replace(/^\d+\.\s*/, "")
                    voteOptions.push({text: option.trim()})
                });

                writeToTerminal("-------------------------", true)
                writeToTerminal(`Viewers, please vote for the next move.`)
            
                toggleInput(false)
                viewerVotes = []
                
                StartTwitchVote(voteOptions, parseInt(elements.voteTime.value), async (winner) => {
                    writeToTerminal(`${gameData.characters.twitch_chat.name} decides to ${winner.text}`)

                    writeToTerminal("-------------------------", true)
                    
                    // generate the AI response to the player's move
                    let endpoint = `v1/chat/completions`
                    let prompt = gptBasePrompt + `The theme of the game is ${gameData.theme}. Please respond to ${gameData.characters.twitch_chat.name}'s move, continue the story from where they left off, using the move as a reference for what they are doing. Do not lead the player, let them decide what to do next. Don't give them options. Do not ask them for their next move.  Do not display their stats in your response.`
                    
                    
                    
                    const body = {
                        model: elements.gptModelSelect.value || 'gpt-4o-mini',
                        messages: [{role: 'system', content: prompt}, ...gameData.history, {role: 'assistant', content: GetPlayerCharacterInfo(true)}, {role: 'user', content: `${gameData.characters.twitch_chat.name} decides to ${winner.text}`}],
                        stream: true,
                    };

                    compressAndAddToHistory( `${gameData.characters.twitch_chat.name} decides to ${winner.text}`, "user")

                    toggleInput(false)
                    const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

                    if (response.status === 200) {
                        let output = "";
                        
                        HandleStream(response.body, (text) => {

                            // make sure text is a string and not empty
                            if (typeof text !== 'string' || text.trim() === '') {
                                return;
                            }

                            text = text.trim();
                            // add brackets to make it valid json
                            text = text.replace('data: ', '"data": ');
                            text = `{${text}}`;
                            // replace data: with "data":
                            

                            // check if chunk is valid json
                            try {
                                const json = JSON.parse(text);
                                // if chunk is valid json, check if it has a completion
                                if (json.data && json.data.choices && json.data.choices.length > 0) {
                                    const completion = json.data.choices[0].delta.content
                                    // check if completion is <empty string>
                                    if (completion && completion.trim().length > 0) {
                                        console.log(completion.toString())
                                        output += completion;
                                    }
                                }
                                
                            } catch (e) {
                                console.log(text)

                            }
                            

                        }, async () => {
                            toggleInput(false)
                            if(elements.aiImages.checked){
                                await asyncGenerateImage(output)
                            }
                            toggleInput(true)

                            
                
                            compressAndAddToHistory( output, "assistant")
                            writeToTerminal(output)
                            writeToTerminal("-------------------------", true)

                            waitForKeypress(async () => {
                                toggleInput(false)
                                checkForChangesAsync(output, true)

                                if(!gameData.died){

                                    writeToTerminal("-------------------------", true)
                                    // check if the streamer is participating
                                    if(elements.streamerParticipates.checked){
                                        // tell the streamer it's their turn
                                        writeToTerminal(`Streamer, it's your turn. Please type your move.`)
                                        gameData.state = "streamer_turn"
                                        toggleInput(true)
                                    }else
                                    {
                                        writeToTerminal("Player, please choose your next move by typing anything, such as 'look around' or 'go north'.")
                                        gameData.state = "viewer_turn"
                                        runGameLoop()
                                    }

                                }
                                    
                            })
                        });
                    }



                })
            });
        }

    }
}

async function startViewerCharacterSelection(prunedHistory){
    // if prunedHistory is not set, set it to the gameData.history
    if(!prunedHistory){
        prunedHistory = [...gameData.history]

        // remove last entry
        prunedHistory.pop()
    }

    // generate gameData.viewerCharacterSelectionFlow options using AI
    /*
    "Race",
    "Class",
    "Background",
    "Alignment",
    "Name",
    */
    let endpoint = `v1/chat/completions`
    let prompt = gptBasePrompt + `The theme of the game is ${gameData.theme}. You are generating the character creation flow, Please provide a list of character selection options to go through, based on the theme. do not add additional story info, ONLY reply with the options.
    Examples:
    Theme: Fantasy
    Output: ["Race", "Class", "Background", "Alignment"]
    Theme: Sci-Fi
    Output: ["Species", "Class", "Background", "Alignment"]
    `

    const body = {
        model: elements.gptModelSelect.value || 'gpt-4o-mini',
        messages: [{role: 'system', content: prompt}, ...prunedHistory, {role: 'user', content: "generate the character selection flow"}],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "creation_flow",
                schema: {
                    type: "object",
                    properties: {
                        flow: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        }
                    },
                    required: ["flow"],
                    additionalProperties: false
                },
                strict: true
                
            },
        },
    };


    const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

    if (response.status === 200) {
        let output = "";

        let json = ""
        HandleStream(response.body, (text) => {
            json += text
        }, () => {
        
            console.log(json)
            // parse json
            let data = JSON.parse(json)
            let flow = JSON.parse(data.choices[0].message.content);

            gameData.viewerCharacterSelectionFlow = flow.flow

            // if gameData.viewerCharacterSelectionFlow does not contain "name", add it
            if(!gameData.viewerCharacterSelectionFlow.includes("Name") && !gameData.viewerCharacterSelectionFlow.includes("name")){
                gameData.viewerCharacterSelectionFlow.push("Name")
            }

            gameData.viewerCharacterSelectionState = 0
            viewerCharacterSelection(prunedHistory)
    
        });
    }

}

async function generateCharacterDescription(description, isViewer){
    // summarize the description down to 50 words or less.
    // leave out any details such as items and things like that.
    // use AI to generate the summary
    let endpoint = `v1/chat/completions`
    let prompt = gptBasePrompt + `The theme of the game is ${gameData.theme}. Summarize the given character in 50 words or less, leave out any story details, and items. Only include details about the character itself. DO NOT INCLUDE ITEMS OR STORY DETAILS, Do not ask for the next move, do not give options. This is just a small description of the character.`
    const body = {
        model: elements.gptModelSelect.value || 'gpt-4o-mini',
        messages: [{role: 'system', content: prompt},{role: 'user', content: `Your character, **Iron Claws**, is a cunning old cat with sharp wit and quicker reflexes. As a rogue, she lurks in the shadows, her agility and keen perception allowing her to navigate the most dangerous of situations. Her prized iron claws are not just for show; they are deadly weapons, honed through years of experience.

Iron Claws has a wiry build, with matted fur that hints at her age, but she carries herself with an air of confidence. Her emerald-green eyes glint with mischief and intelligence, always scanning for potential threats and opportunities alike. While she may have a short temper, fueled by her frustration with less capable companions, her heart remains loyal to those who earn her trust.

To start your adventure, Iron Claws is equipped with a few essential items:

- **Iron Claws**: Her signature weapons, sharp and deadly, capable of slashing through defenses.
- **Cloak of Shadows**: A dark cloak that grants her the ability to blend into her surroundings when still.
- **Thieves' Tools**: A small pouch containing lockpicks and other instruments necessary for a rogue.
- **Health Potion**: A vial filled with a shimmering liquid to restore her energy in times of need.

The Guildmaster nods approvingly as he surveys Iron Claws. “You're quite the sight, cat!” he remarks. “With your skills, you are bound to find interesting challenges ahead.”As you take in your surroundings, you notice various quests on the notice board, each promising adventure and rewards.I see you have someone with you, who is that?`}, {role: "assistant", content: `Iron Claws is a cunning, agile, and sharp-witted old cat rogue with a wiry build and matted fur. Her emerald-green eyes reflect mischief and intelligence. Despite her age and short temper, she remains loyal to those who earn her trust, using her honed iron claws as deadly weapons.`}, {role: 'user', content: description}],
        stream: true,
    };

    const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

    if (response.status === 200) {
        let output = "";
        
        HandleStream(response.body, (text) => {

            // make sure text is a string and not empty
            if (typeof text !== 'string' || text.trim() === '') {
                return;
            }

            text = text.trim();
            // add brackets to make it valid json
            text = text.replace('data: ', '"data": ');
            text = `{${text}}`;
            // replace data: with "data":
            

            // check if chunk is valid json
            try {
                const json = JSON.parse(text);
                // if chunk is valid json, check if it has a completion
                if (json.data && json.data.choices && json.data.choices.length > 0) {
                    const completion = json.data.choices[0].delta.content
                    // check if completion is <empty string>
                    if (completion && completion.trim().length > 0) {
                        console.log(completion.toString())
                        output += completion;
                    }
                }
                
            } catch (e) {
                console.log(text)

            }
            

        }, () => {
            if(isViewer){
                gameData.characters.twitch_chat.description = output
            }else{
                gameData.characters.player.description = output
            }
        });
    }

}

async function ParseCharacterStats(text, isViewer, callback){
    // have the AI parse the text and decide the character's stats
    // use a json schema to make sure the AI response is in the correct format
    let endpoint = `v1/chat/completions`
    let prompt = gptBasePrompt + `You are determining the character's stats based on the provided text. Please provide a short description (50 words or less), health points, inventory, gold, status effects, and abilities. Do not add additional story info. also choose the character's max health points, and the following stats: strength, dexterity, constitution, intelligence, wisdom, and charisma, based on the character description.`
    
    const body = {
        model: elements.gptModelSelect.value || 'gpt-4o-mini',
        messages: [{role: 'system', content: prompt}, {role: 'user', content: text}],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "character_stats",
                schema: {
                    type: "object",
                    properties: {
                        description: {
                            type: "string"
                        },
                        health: {
                            type: "integer"
                        },
                        max_health: {
                            type: "integer"
                        },
                        gold: {
                            type: "integer"
                        },
                        strength: {
                            type: "integer"
                        },
                        dexterity: {
                            type: "integer"
                        },
                        constitution: {
                            type: "integer"
                        },
                        intelligence: {
                            type: "integer"
                        },
                        wisdom: {
                            type: "integer"
                        },
                        charisma: {
                            type: "integer"
                        },
                        inventory: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string"
                                    },
                                    description: {
                                        type: "string"
                                    }
                                },
                                required: ["name", "description"],
                                additionalProperties: false
                            }
                        },
                        status_effects: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string"
                                    },
                                    description: {
                                        type: "string"
                                    }
                                },
                                required: ["name", "description"],
                                additionalProperties: false
                            }
                        },
                        abilities: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string"
                                    },
                                    description: {
                                        type: "string"
                                    }
                                },
                                required: ["name", "description"],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["description", "health", "max_health", "gold", "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma", "inventory", "status_effects", "abilities"],
                    additionalProperties: false
                },
                strict: true
                
            },
        },
    };
    
    const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

    if (response.status === 200) {
        let output = "";

        let json = ""
        HandleStream(response.body, (text) => {
            json += text
        }
        , () => {
            // parse json
            let content = JSON.parse(json)
            
            let data = JSON.parse(content.choices[0].message.content)

            console.log(data)

            if(isViewer){
                gameData.characters.twitch_chat.description = data.description
                gameData.characters.twitch_chat.health = data.health
                gameData.characters.twitch_chat.max_health = data.max_health
                gameData.characters.twitch_chat.gold = data.gold
                gameData.characters.twitch_chat.inventory = data.inventory
                gameData.characters.twitch_chat.status_effects = data.status_effects
                gameData.characters.twitch_chat.abilities = data.abilities
                gameData.characters.twitch_chat.stats = {
                    strength: data.strength,
                    dexterity: data.dexterity,
                    constitution: data.constitution,
                    intelligence: data.intelligence,
                    wisdom: data.wisdom,
                    charisma: data.charisma
                }
            

            }else{
                gameData.characters.player.description = data.description
                gameData.characters.player.health = data.health
                gameData.characters.player.max_health = data.max_health
                gameData.characters.player.gold = data.gold
                gameData.characters.player.inventory = data.inventory
                gameData.characters.player.status_effects = data.status_effects
                gameData.characters.player.abilities = data.abilities
                gameData.characters.player.stats = {
                    strength: data.strength,
                    dexterity: data.dexterity,
                    constitution: data.constitution,
                    intelligence: data.intelligence,
                    wisdom: data.wisdom,
                    charisma: data.charisma
                }
        

            }

            callback()
        });
    }else{
        callback()
    }
}

async function asyncParseCharacterStats(text, isViewer){
    return new Promise((resolve, reject) => {
        ParseCharacterStats(text, isViewer, () => {
            resolve()
        })
    })
}



async function viewerCharacterSelection(prunedHistory){
    // have the AI generate different options for the viewers to pick from, and go through the gameData.viewerCharacterSelectionFlow

    // clear vote
    viewerVotes = []
    activeVote = null
    activeVoteEntry = null

    let endpoint = `v1/chat/completions`
    let prompt = gptBasePrompt + ` The theme of the game is ${gameData.theme}. You are generating vote options for the player's ${gameData.viewerCharacterSelectionFlow[gameData.viewerCharacterSelectionState]}. Their character so far is ${gameData.characters.twitch_chat.description}. Please provide 5 options for the player to choose from, keep these options under 25 words, do not add additional story info, ONLY reply with the options. Do not number the options.`
    const body = {
        model: elements.gptModelSelect.value || 'gpt-4o-mini',
        messages: [{role: 'system', content: prompt}, ...prunedHistory, {role: 'user', content: "generate the options"}],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "vote_options",
                schema: {
                    type: "object",
                    properties: {
                        options: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        }
                    },
                    required: ["options"],
                    additionalProperties: false
                },
                strict: true
                
            },
        },
    };
    
    let isName = gameData.viewerCharacterSelectionFlow[gameData.viewerCharacterSelectionState].toLowerCase() == "name"

    const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

    if (response.status === 200) {
        let output = "";

        console.log(response.body)
        toggleInput(false)
        let json = ""
        HandleStream(response.body, (text) => {
            json += text
        }, () => {
            // parse json
            let data = JSON.parse(json)
            let options = JSON.parse(data.choices[0].message.content);

            let voteOptions = []
            options.options.forEach(option => {
                option = option.replace(/^\d+\.\s*/, "")
                voteOptions.push({text: option.trim()})
            });

            writeToTerminal("-------------------------", true)
            writeToTerminal(`Viewers, please vote for the ${gameData.viewerCharacterSelectionFlow[gameData.viewerCharacterSelectionState]} of your character.`)

            StartTwitchVote(voteOptions, parseInt(elements.voteTime.value), async (winner) => {
                gameData.characters.twitch_chat.description += `${gameData.viewerCharacterSelectionFlow[gameData.viewerCharacterSelectionState]}: ${winner.text}\n`

                if (isName){
                    gameData.characters.twitch_chat.name = winner.text
                }

                gameData.viewerCharacterSelectionState++
                writeToTerminal(`Viewers have chosen "${winner.text}."`)
                if(gameData.viewerCharacterSelectionState < gameData.viewerCharacterSelectionFlow.length){
                    waitForKeypress(async () => {
                        viewerCharacterSelection(prunedHistory)
                    })
                }else{
                    // have the AI summarize the character
                    let endpoint = `v1/chat/completions`
                    let prompt = gptBasePrompt + ` The theme of the game is ${gameData.theme}. Please summarize the character, add additional details if necessary. You may also give the player some starting items.`
                    const body = {
                        model: elements.gptModelSelect.value || 'gpt-4o-mini',
                        messages: [{role: 'system', content: prompt}, ...prunedHistory, {role: 'user', content: gameData.characters.twitch_chat.description}],
                        stream: true,
                    };

                    const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

                    if (response.status === 200) {
                        compressAndAddToHistory( gameData.characters.twitch_chat.description, "user")
                        prunedHistory.push({content: gameData.characters.twitch_chat.description, role: "user"})
                        let [msg, save_entry] = writeToTerminal(`test`, true);
                        let output = "";
                        let ttsText = ""
                        
                        HandleStream(response.body, (text) => {

                            // make sure text is a string and not empty
                            if (typeof text !== 'string' || text.trim() === '') {
                                return;
                            }

                            text = text.trim();
                            // add brackets to make it valid json
                            text = text.replace('data: ', '"data": ');
                            text = `{${text}}`;
                            // replace data: with "data":
                            

                            // check if chunk is valid json
                            try {
                                const json = JSON.parse(text);
                                // if chunk is valid json, check if it has a completion
                                if (json.data && json.data.choices && json.data.choices.length > 0) {
                                    const completion = json.data.choices[0].delta.content
                                    // check if completion is <empty string>
                                    if (completion && completion.trim().length > 0) {
                                        console.log(completion.toString())
                                        output += completion;

                                        ttsText += completion

                                        // split sentence by . or ! or ?
                                        var sentences = ttsText.split(/(?<=[.!?])\s*/);
                                        if(sentences.length > 1){
                                            let firstSentence = sentences.shift().trim()
                                            ttsText = sentences.join("")
                                            TryToSpeak(firstSentence)
                                        }

                                        msg.innerHTML = parseMinecraftColorCodes(output);

                                        // update save entry
                                        if (save_entry) {
                                            save_entry.text = output;
                                        }

                                        elements.outputDiv.scrollTop = elements.outputDiv.scrollHeight;
                                    }
                                }
                                
                            } catch (e) {
                                console.log(text)

                            }
                            

                        }, async () => {
                            toggleInput(false)
                            if(elements.aiImages.checked){
                                await asyncGenerateImage(gameData.characters.twitch_chat.description)
                            }
                            

                            await asyncParseCharacterStats(output, true)
                            toggleInput(true)
                            // print character info
                            writeToLog("-------------------------", true)
                            writeToLog(`Your character, ${gameData.characters.twitch_chat.name}, has been created. Here are the details:`, true)
                            writeToLog(GetPlayerCharacterInfo(true), true)
                            writeToLog("-------------------------", true)

                            waitForKeypress(async () => {
                                compressAndAddToHistory( output, "assistant")
                                if(ttsText.length > 0){
                                    TryToSpeak(ttsText)
                                }

            
                                
                                toggleInput(true)
                                // check if the streamer is participating
                                if(elements.streamerParticipates.checked){
                                    gameData.state = "streamer_turn"
                                    writeToTerminal("To start your adventure, type anything you like, such as 'look around' or 'go north'.")
                                    writeToTerminal("You may also check your characters by typing 'info'.")                                        
                                }else{
                                    gameData.state = "viewer_turn"

                                    runGameLoop()
                                }
                            });
                        });
                    }
                }
            })
        });
        

    }

}
    


async function executeCommand(input) {
    const [command, ...args] = input.split(' ');

    if(gameData.state == "none"){
        if (command === 'start') {
            if(await checkSettings()){
                gameData.state = "theme"
            }
        }
    }
    else if(gameData.state == "theme"){
        gameData.theme = input;
        // have the AI generate a starting setting
        let endpoint = `v1/chat/completions`
        let prompt = gptBasePrompt + ` The theme of the game is ${gameData.theme}. Please give a brief description the starting location and situation. Note you do not know the player's name, race, or anything about them yet. Do not include any player specific information. The player will pick their character after this. Keep it brief, at the end ask the player to describe their character, make sure to segway into it smoothly.`
        const body = {
            model: elements.gptModelSelect.value || 'gpt-4o-mini',
            messages: [{role: 'system', content: prompt}, {role: 'user', content: "Please describe the starting location and situation."}],
            stream: true,
        };


        const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);
        if (response.status === 200) {
            let [msg, save_entry] = writeToTerminal(`test`, true);
            let output = "";
            let ttsText = ""
            toggleInput(false)
            HandleStream(response.body, (text) => {

                // make sure text is a string and not empty
                if (typeof text !== 'string' || text.trim() === '') {
                    return;
                }

                text = text.trim();
                // add brackets to make it valid json
                text = text.replace('data: ', '"data": ');
                text = `{${text}}`;
                // replace data: with "data":
                

                // check if chunk is valid json
                try {
                    const json = JSON.parse(text);
                    // if chunk is valid json, check if it has a completion
                    if (json.data && json.data.choices && json.data.choices.length > 0) {
                        const completion = json.data.choices[0].delta.content
                        // check if completion is <empty string>
                        if (completion && completion.trim().length > 0) {
                            output += completion;

                            ttsText += completion
                            // split sentence by . or ! or ?
                            var sentences = ttsText.split(/(?<=[.!?])\s*/);
                            if(sentences.length > 1){
                                let firstSentence = sentences.shift().trim()
                                ttsText = sentences.join("")
                                TryToSpeak(firstSentence)
                            }

                            msg.innerHTML = parseMinecraftColorCodes(output);

                            console.log(completion)

                            // update save entry
                            if (save_entry) {
                                save_entry.text = output;
                            }

                            elements.outputDiv.scrollTop = elements.outputDiv.scrollHeight;
                        }
                    }
                    
                } catch (e) {
                    //console.log(text)

                }
                

            }, async () => {
                toggleInput(false)
                if(elements.aiImages.checked){
                    await asyncGenerateImage(output)
                }
                toggleInput(true)

                compressAndAddToHistory( output, "assistant")

                if(ttsText.length > 0){
                    TryToSpeak(ttsText)
                }
                //writeToTerminal("Player, please describe your character, in as much detail as you like.")
                // check if twitch a twitch channel is set
                if(elements.twitchChannelInput.value && elements.twitchChannelInput.value.length > 0){
                    if(elements.streamerParticipates.checked){
                        gameData.state = "character"
                        toggleInput(true)
                        writeToTerminal("-------------------------", true)
                        writeToTerminal(`Streamer, please describe your character, in as much detail as you like. Your viewers will pick their character after you.`)
                    }else{
                        toggleInput(false)
                        gameData.state = "viewer_character_selection"
                        startViewerCharacterSelection()
                    }
                }else{
                    gameData.state = "character"
                    writeToTerminal("-------------------------", true)
                    writeToTerminal("Player, please describe your character, in as much detail as you like.")
                    toggleInput(true)
                }
            

            });
        }


        
    }
    else if(gameData.state == "character"){
        gameData.characters.player.description = input;
        toggleInput(true)
        writeToTerminal("-------------------------", true)
        gameData.state = "name"
        writeToTerminal("Please give your character's name.")
    }
    else if (gameData.state == "name"){
        gameData.characters.player.description += ` Name: ${input}\n`
        gameData.characters.player.name = input

        let endpoint = `v1/chat/completions`
        let prompt = gptBasePrompt + ` The theme of the game is ${gameData.theme}. Please summarize the character, add additional details if necessary. You may also give the player some starting items.`

        // check if
        if(elements.twitchChannelInput.value && elements.twitchChannelInput.value.length > 0){
            prompt = prompt + ` end with "I see you have someone with you, who is that?"`
        }else{
            prompt = prompt + ` end by asking the player what they wish to do next, with a little bit more story info.`
        }

        const body = {
            model: elements.gptModelSelect.value || 'gpt-4o-mini',
            messages: [{role: 'system', content: prompt}, ...gameData.history, {role: 'user', content: gameData.characters.player.description}],
            stream: true,
        };
        

        const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

        if (response.status === 200) {

            let [msg, save_entry] = writeToTerminal(`test`, true);
            let output = "";
            let ttsText = ""
            toggleInput(false)
            HandleStream(response.body, (text) => {

                // make sure text is a string and not empty
                if (typeof text !== 'string' || text.trim() === '') {
                    return;
                }

                text = text.trim();
                // add brackets to make it valid json
                text = text.replace('data: ', '"data": ');
                text = `{${text}}`;
                // replace data: with "data":
                

                // check if chunk is valid json
                try {
                    const json = JSON.parse(text);
                    // if chunk is valid json, check if it has a completion
                    if (json.data && json.data.choices && json.data.choices.length > 0) {
                        const completion = json.data.choices[0].delta.content
                        // check if completion is <empty string>
                        if (completion && completion.trim().length > 0) {
                            output += completion;

                            // add to tts text, if it contains a ending . or ! or ?, split and speak the first sentence, and put the rest back in ttsText
                            ttsText += completion
                            var sentences = ttsText.split(/(?<=[.!?])\s*/);
                            if(sentences.length > 1){
                                let firstSentence = sentences.shift().trim()
                                ttsText = sentences.join("")
                                TryToSpeak(firstSentence)
                            }

                            msg.innerHTML = parseMinecraftColorCodes(output);

                            


                            // update save entry
                            if (save_entry) {
                                save_entry.text = output;
                            }


                            elements.outputDiv.scrollTop = elements.outputDiv.scrollHeight;
                        }
                    }
                    
                } catch (e) {
                    console.log(text)

                }
                

            }, async () => {
                toggleInput(false)
                compressAndAddToHistory( output, "assistant")
                if(ttsText.length > 0){
                    TryToSpeak(ttsText)
                }
                if(elements.aiImages.checked){
                    await asyncGenerateImage(gameData.characters.player.description)
                }
                
                //generateCharacterDescription(output, false)

                await asyncParseCharacterStats(output, false)
                toggleInput(true)
                // print character info
                writeToLog("-------------------------", true)
                writeToLog(`Your character, ${gameData.characters.player.name}, has been created. Here are the details:`, true)
                writeToLog(GetPlayerCharacterInfo(false), true)

                writeToLog("-------------------------", true)
                //checkForChanges(output, false, () => {

                    
                    if(elements.twitchChannelInput.value && elements.twitchChannelInput.value.length > 0){
                        waitForKeypress(async () => {
                            gameData.state = "viewer_character_selection"
                            startViewerCharacterSelection()
                        })
                    }else{
                        toggleInput(true)
                        gameData.state = "streamer_turn"
                        writeToTerminal("To start your adventure, type anything you like, such as 'look around' or 'go north'.")
                        writeToTerminal("You may also check your character by typing 'info'.")
                    }       
                //})
            
            });
        }
    }
    else if (gameData.state == "streamer_turn"){

        // check if streamer just said "info"
        if(input.toLowerCase() == "info"){
            writeToLog(GetPlayerCharacterInfo(false), true)
            // if twitch chat is playing too, show their info
            if(elements.twitchChannelInput.value && elements.twitchChannelInput.value.length > 0){
                writeToLog("-------------------------", true)
                writeToTerminal(GetPlayerCharacterInfo(true), true)
            }
            writeToLog("-------------------------", true)
            
        }else{
            writeToTerminal(`${gameData.characters.player.name} decides to ${input}`, true)

            viewerTurn = false
            writeToTerminal("-------------------------", true)
            
            // generate the AI response to the player's move
            let endpoint = `v1/chat/completions`
            let prompt = gptBasePrompt + ` The theme of the game is ${gameData.theme}. Please respond to ${gameData.characters.player.name}'s move, continue the story from where they left off, using the move as a reference for what they are doing. Do not lead the player, let them decide what to do next. Don't give them options. Do not ask them for their next move. Do not display their stats in your response.`
            const body = {
                model: elements.gptModelSelect.value || 'gpt-4o-mini',
                messages: [{role: 'system', content: prompt}, ...gameData.history, {role: 'assistant', content: GetPlayerCharacterInfo(true)}, {role: 'user', content: `${gameData.characters.player.name} decides to ${input}`}],
                stream: true,
            };

            
            compressAndAddToHistory( `${gameData.characters.player.name} decides to ${input}`, "user")
            toggleInput(false)
            const response = await GPTRequest(endpoint, elements.apiKeyInput.value, body);

            if (response.status === 200) {
                let output = "";
                
                HandleStream(response.body, (text) => {

                    // make sure text is a string and not empty
                    if (typeof text !== 'string' || text.trim() === '') {
                        return;
                    }

                    text = text.trim();
                    // add brackets to make it valid json
                    text = text.replace('data: ', '"data": ');
                    text = `{${text}}`;
                    // replace data: with "data":
                    

                    // check if chunk is valid json
                    try {
                        const json = JSON.parse(text);
                        // if chunk is valid json, check if it has a completion
                        if (json.data && json.data.choices && json.data.choices.length > 0) {
                            const completion = json.data.choices[0].delta.content
                            // check if completion is <empty string>
                            if (completion && completion.trim().length > 0) {
                                console.log(completion.toString())
                                output += completion;
                            }
                        }
                        
                    } catch (e) {
                        console.log(text)

                    }
                

                }, async () => {
                    toggleInput(false)
                    if(elements.aiImages.checked){
                        await asyncGenerateImage(output)
                    }
                    toggleInput(true)
            
                    compressAndAddToHistory( output, "assistant")
                    writeToTerminal(output)
                    
                    checkForChangesAsync(output, false)

                    // check if dead
                    if(!gameData.died){
                        
                        writeToTerminal("-------------------------", true)
                        // check if we are doing twitch viewer participation
                        if(elements.twitchChannelInput.value && elements.twitchChannelInput.value.length > 0){
                            waitForKeypress(async () => {
                                toggleInput(false)
                                gameData.state = "viewer_turn"
                                runGameLoop()
                            })
                        }
                    }
            
            
                });
            }
        }
    }
}

checkSettings()

function parseMinecraftColorCodes(text) {
    const colorCodes = {
        '&0': 'color:#000000',
        '&1': 'color:#0000AA',
        '&2': 'color:#00AA00',
        '&3': 'color:#00AAAA',
        '&4': 'color:#AA0000',
        '&5': 'color:#AA00AA',
        '&6': 'color:#FFAA00',
        '&7': 'color:#AAAAAA',
        '&8': 'color:#555555',
        '&9': 'color:#5555FF',
        '&a': 'color:#55FF55',
        '&b': 'color:#55FFFF',
        '&c': 'color:#FF5555',
        '&d': 'color:#FF55FF',
        '&e': 'color:#FFFF55',
        '&f': 'color:#FFFFFF'
    };
    return text.replace(/(&[0-9a-f])/g, match => {
        const style = colorCodes[match] || 'color:#FFFFFF';
        return `<span style="${style}">`;
    }) + '</span>'.repeat((text.match(/&[0-9a-f]/g) || []).length);
}

function cleanText(text){
    return text.replace(/&[0-9a-f]/g, "")
}
