document.addEventListener('DOMContentLoaded', async function() {

    /*
<label for="api-key">OpenAI API Key:</label>
<div style="display: flex; align-items: center;">
    <input id="api-key-input" type="password" />
    <span id="toggle-api-key" class="fas fa-eye-slash" style="margin-left: 2px; cursor: pointer;"></span>
</div>

<label for="gpt-model-select">GPT Model:</label>
<input type="text" id="gpt-model-select" placeholder="i.e. gpt-4o" value="gpt-4o-mini"><br><br>

<label for="twitch-channel">Twitch Channel Name:</label>
<input type="text" id="twitch-channel" placeholder="Enter Twitch Channel Name"><br><br>

<!--Checkbox for allowing streamer to take part in the adventure-->
<label for="take-turns">Streamer participates:</label>
<input type="checkbox" id="take-turns" checked="true"><br><br>

<!-- Vote time -->
<label for="vote-time">Vote Time (seconds):</label>
<input type="number" id="vote-time" value="30"><br><br>

<!-- Include AI Images -->
<label for="ai-images">Include AI Images (Experimental):</label>
<input type="checkbox" id="ai-images" checked="false"><br><br>

<!-- Use Text To Speech -->
<label for="use-tts">Use Text To Speech:</label>
<input type="checkbox" id="use-tts" checked="true"><br><br>

<!-- Speakerbot Address -->
<label for="speakerbot-address">Speakerbot Address:</label>'
<input type="text" id="speakerbot-address" value="localhost"><br><br>'

<!-- Speakerbot Port -->
<label for="speakerbot-port">Speakerbot Port:</label>
<input type="number" id="speakerbot-port" value="7680"><br><br>

<!-- Narrator Voice Alias -->
<label for="narrator-voice-alias">Narrator Voice Alias:</label>
<input type="text" id="narrator-voice-alias" value="narrator"><br><br>
    */

    const inputField = document.getElementById('input');
    const outputDiv = document.getElementById('output');
    const terminalDiv = document.getElementById('terminal');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const apiKeyInput = document.getElementById('api-key-input');
    const twitchChannelInput = document.getElementById('twitch-channel');
    const gptModelSelect = document.getElementById('gpt-model-select');
    const toggleApiKey = document.getElementById('toggle-api-key');
    const streamerParticipates = document.getElementById('take-turns');
    const voteTime = document.getElementById('vote-time');
    const aiImages = document.getElementById('ai-images');
    const useTTS = document.getElementById('use-tts');
    const speakerbotAddress = document.getElementById('speakerbot-address');
    const speakerbotPort = document.getElementById('speakerbot-port');
    const narratorVoiceAlias = document.getElementById('narrator-voice-alias');

    let state = "none"
    let theme = "fantasy"

    let viewerCharacterSelectionFlow = [
    ]
    let viewerCharacterSelectionState = 0
    
    let characters = {
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
    }

    let maximumHistory = 50
    let history = []



    const gptBasePrompt = `You are a game master for a text based adventure game. You will not be offensive or vulgar, and you will not break the fourth wall.
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
    `


    // try to get api key from local storage
    let apiKey = localStorage.getItem('twitchdungeon-apiKey');
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }

    let twitchChannel = localStorage.getItem('twitchdungeon-channel');
    if (twitchChannel) {
        twitchChannelInput.value = twitchChannel;
    }

    // if api key is changed, save it to local storage
    apiKeyInput.addEventListener('input', () => {
        localStorage.setItem('twitchdungeon-apiKey', apiKeyInput.value);
        apiKey = apiKeyInput.value;
    });

    function AddToHistory(content, role){
        history.push({content: content, role: role})
        if(history.length > maximumHistory){
            history.shift()
        }
    }

    // if twitch channel is changed, save it to local storage
    twitchChannelInput.addEventListener('input', () => {
        localStorage.setItem('twitchdungeon-channel', twitchChannelInput.value);
        twitchChannel = twitchChannelInput.value;
    });

    // if viewer participation is changed, save it to local storage
    streamerParticipates.checked = localStorage.getItem('twitchdungeon-streamer-participates') ? localStorage.getItem('twitchdungeon-streamer-participates') == 'true' : true;
    streamerParticipates.addEventListener('input', () => {
        localStorage.setItem('twitchdungeon-streamer-participates', streamerParticipates.checked);
    });

    voteTime.value = localStorage.getItem('twitchdungeon-vote-time') || 30;
    voteTime.addEventListener('input', () => {
        localStorage.setItem('twitchdungeon-vote-time', voteTime.value);
    });

    aiImages.checked = localStorage.getItem('twitchdungeon-ai-images') ? localStorage.getItem('twitchdungeon-ai-images') == 'true' : false;
    aiImages.addEventListener('input', () => {
        localStorage.setItem('twitchdungeon-ai-images', aiImages.checked);
    });

    useTTS.checked = localStorage.getItem('twitchdungeon-use-tts') ? localStorage.getItem('twitchdungeon-use-tts') == 'true' : false;
    useTTS.addEventListener('input', () => {
        localStorage.setItem('twitchdungeon-use-tts', useTTS.checked);
    });

    speakerbotAddress.value = localStorage.getItem('twitchdungeon-speakerbot-address') || 'localhost';
    speakerbotAddress.addEventListener('input', () => {
        localStorage.setItem('twitchdungeon-speakerbot-address', speakerbotAddress.value);
    });

    speakerbotPort.value = localStorage.getItem('twitchdungeon-speakerbot-port') || 7580;
    speakerbotPort.addEventListener('input', () => {
        localStorage.setItem('twitchdungeon-speakerbot-port', speakerbotPort.value);
    });

    narratorVoiceAlias.value = localStorage.getItem('twitchdungeon-narrator-voice-alias') || '';
    narratorVoiceAlias.addEventListener('input', () => {
        localStorage.setItem('twitchdungeon-narrator-voice-alias', narratorVoiceAlias.value);
    });

    let apiKeyVisible = false;

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

    let activeVote = null
    let viewerVotes = []
    let activeVoteEntry = null
    let timeLeft = 0

    async function GenerateVoteMessage(){
        if(activeVoteEntry){
            let output = ""
            activeVote.forEach((option, index) => {
                output += `${index + 1}) [${option.votes}] ${option.text}&f\n`
            });
            output += `Vote by typing the number of your choice. You have ${timeLeft} seconds left to vote.`
            activeVoteEntry.innerHTML = parseMinecraftColorCodes(output)
            outputDiv.scrollTop = outputDiv.scrollHeight;
        }else{
            let output = ""
            activeVote.forEach((option, index) => {
                TryToSpeak(`${index + 1}. ${option.text}&f\n`)
                output += `${index + 1}) ${option.text}&f\n`
            });
            output += `Vote by typing the number of your choice. You have ${timeLeft} seconds left to vote.`
            activeVoteEntry = print(output, false, true)
        }
    }

    async function StartTwitchVote(options, duration, finishCallback){
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

        let summary = await asyncGenerateSummary(prompt)

        // json parse the summary
        let summaryData = JSON.parse(summary)

        prompt = summaryData.choices[0].message.content

        // generate an image using dall-e
        let endpoint = `v1/images/generations`
        const body = {
            model: "dall-e-2",
            prompt: `${prompt}, in the style of a pixel art game.`,
            size: "256x256",
            response_format: "b64_json",
            n: 1,
        };

        const response = await GPTRequest(endpoint, apiKey, body);

        // read whole stream and get the image.
        let image = ""
        HandleStream(response.body, async(text) => {
            image += text
        }, () => {
            // parse json
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
            
                /*

                const ascii = imageToMinecraftAscii(ctx, 32, 32);
                // split by new line
                let lines = ascii.split('\n')

                // loop through each line and print it
                lines.forEach(line => {
                    print(line, true)
                });

                if(callback){
                    callback(ascii)
                }*/

                // add image to output
                const imageDiv = document.createElement('div');
                imageDiv.classList.add('image');
                imageDiv.appendChild(img);
                outputDiv.appendChild(imageDiv);
                // Scroll to the bottom of the terminal
                outputDiv.scrollTop = outputDiv.scrollHeight;

                if(callback){
                    callback()
                }
            };
            
           
        });

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
            let prompt = gptBasePrompt + `The theme of the game is ${theme}. Summarize the scene in 50 words or less, Only describe the scene, do not talk in first person, do not talk about yourself as a chatter, Only include details about the scene itself. Do not ask for the next move, do not give options. This is just a small description of the scene. Make sure the include the theme in your summary.`
            const body = {
                model: gptModelSelect.value || 'gpt-4o-mini',
                messages: [{role: 'system', content: prompt}, {role: 'user', content: text}],
            };

            
            const response = await GPTRequest(endpoint, apiKey, body);

            if (response.status === 200) {
                let output = "";
                HandleStream(response.body, (text) => {
                    output += text
                }, () => {
                    resolve(output)
                });
            }else{
                console.log(response)
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
            ws.send('JOIN #' + twitchChannel);
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
        const ws = new WebSocket(`ws://${speakerbotAddress.value}:${speakerbotPort.value}`);
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
        if (!useTTS.checked) {
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
                speakerbot.send(JSON.stringify({id: "1", request: "Speak", voice: narratorVoiceAlias.value, message: sentence.trim(), badWordFilter: true}))
            }else if(!speakerbot || speakerbot.readyState == WebSocket.CLOSED || speakerbot.readyState == WebSocket.CLOSING){
                ConnectToSpeakerbot()
            }
        });

    }


    function print(text, zeroWidth = false, skipSpeaking = false) {
        // Return early if text is nil or undefined
        if (!text) {
            return;
        }
        
        const outputLine = document.createElement('div');
        outputLine.innerHTML = parseMinecraftColorCodes(text);
        outputDiv.appendChild(outputLine);
        // Scroll to the bottom of the terminal
        outputDiv.scrollTop = outputDiv.scrollHeight;

        if (zeroWidth) {
            // set margins and paddings on top and bottom to 0
            outputLine.style.marginTop = '0';
            outputLine.style.marginBottom = '-8';
            outputLine.style.paddingTop = '0';
            outputLine.style.paddingBottom = '0';
        }else{
            if(!skipSpeaking){
                TryToSpeak(text)
            }
        }
    
        // Scroll to the bottom of the terminal
        outputDiv.scrollTop = outputDiv.scrollHeight;
        return outputLine;
    }

    function clear() {
        outputDiv.innerHTML = '';
        outputDiv.scrollTop = outputDiv.scrollHeight;
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

    function toggleInput(enabled) {
        inputField.disabled = !enabled;
        inputField.placeholder = enabled ? '' : 'Waiting for API response...';
        if(continueCallback != null){
            inputField.placeholder = 'Press any key to continue...';
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

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    toggleApiKey.addEventListener('click', () => {
        apiKeyVisible = !apiKeyVisible;
        if (!apiKeyVisible) {
            apiKeyInput.type = 'password';
            toggleApiKey.classList.remove('fa-eye');
            toggleApiKey.classList.add('fa-eye-slash');
        } else {
            apiKeyInput.type = 'text';
            toggleApiKey.classList.remove('fa-eye-slash');
            toggleApiKey.classList.add('fa-eye');
        }
    });
    terminalDiv.addEventListener('click', () => {
        inputField.focus();
    });

    inputField.addEventListener('keydown', function(event) {
        if(continueCallback){
            // if any key is pressed, call the continue callback

            // clear the input field
            inputField.value = ''
            toggleInput(false)
            // clear again after 1 second
            setTimeout(() => {
                inputField.value = ''
                continueCallback()
                continueCallback = null
                inputField.placeholder = ''
            }, 100)
            return
        }
        if (event.key === 'Enter') {
            const command = inputField.value;
            inputField.value = ''; // Clear input field
            // Create a new line with the command and append it to the output
            const commandLine = document.createElement('div');
            commandLine.innerHTML = `> ${parseMinecraftColorCodes(command)}`;
            outputDiv.scrollTop = outputDiv.scrollHeight;
            outputDiv.appendChild(commandLine);
            // Execute the command (simulate execution)
            executeCommand(command);
        }
    });

    async function waitForKeypress(callback){
        continueCallback = callback
        toggleInput(true)
    }

    async function checkSettings() {
        if (!apiKeyInput.value) {
            print('Please enter your OpenAI API key in the sidebar menu, then type "start" to begin.');
            return false
        }else{
            // make a tiny api request to check if the api key is valid
            const model = gptModelSelect.value || 'gpt-4o-mini';
    
            let endpoint = `v1/chat/completions`
            // send gpt chat request and stream the response to the terminal, every time we receive a chunk
            const body = {
                model: model,
                messages: [{role: 'system', content: 'You are a helpful assistant.'}, {role: 'user', content: "hello!"}],
                max_tokens: 20
            };
    
            const response = await GPTRequest(endpoint, apiKeyInput.value, body);
    
            if (response.status === 200) {
                // clear the terminal
                clear();
                print("Welcome adventurer, please choose a theme for your adventure: ")
                state = "theme"
                ConnectToSpeakerbot()
                // if twitch channel is set, connect to twitch
                if(twitchChannel && twitchChannel.length > 0){
                    ConnectToTwitch()
                }
                return true;
            } else {
                print('Your API key is invalid, does not have access to the model, or you have exceeded your quota. Please update your API key then type "start" to begin.');
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
        `

        const body = {
            model: gptModelSelect.value || 'gpt-4o-mini',
            messages: [{role: 'system', content: prompt}, {role: 'user', content: GetPlayerCharacterInfo(isViewer)}, {role: 'user', content: text}],
            response_format: {
                type: "json_object",
            },
        };

        const response = await GPTRequest(endpoint, apiKey, body);

        if (response.status === 200) {
            let output = "";

            let json = ""
            HandleStream(response.body, (text) => {
                json += text
            }, () => {
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
                    if(item.action == "gained"){
                        if(isViewer){
                            characters.twitch_chat.inventory.push({name: item.name, description: item.description})
                            print(`${characters.twitch_chat.name} has gained a ${item.name} - ${item.description}`, false, true)
                        }else{
                            characters.player.inventory.push({name: item.name, description: item.description})
                            print(`${characters.player.name} has gained a ${item.name} - ${item.description}.`, false, true)
                        }
                    }else if(item.action == "lost"){
                        if(isViewer){
                            characters.twitch_chat.inventory = characters.twitch_chat.inventory.filter(i => i != item.name)
                            print(`${characters.twitch_chat.name} has lost a ${item.name} - ${item.description}.`, false, true)
                        }else{
                            characters.player.inventory = characters.player.inventory.filter(i => i != item.name)
                            print(`${characters.player.name} has lost a ${item.name} - ${item.description}.`, false, true)
                        }
                    }
                });

                statusEffects.forEach(statusEffect => {
                    if(statusEffect.action == "gained"){
                        if(isViewer){
                            characters.twitch_chat.status_effects.push({name: statusEffect.name, description: statusEffect.description})
                            print(`${characters.twitch_chat.name} gained status effect ${statusEffect.name} - ${statusEffect.description}.`, false, true)
                        }else{
                            characters.player.status_effects.push({name: statusEffect.name, description: statusEffect.description})
                            print(`${characters.player.name} gained status effect ${statusEffect.name} - ${statusEffect.description}.`, false, true)
                        }
                    }else if(statusEffect.action == "lost"){
                        if(isViewer){
                            characters.twitch_chat.status_effects = characters.twitch_chat.status_effects.filter(i => i != statusEffect.name)
                            print(`${characters.twitch_chat.name} lost status effect ${statusEffect.name}.`, false, true)
                        }else{
                            characters.player.status_effects = characters.player.status_effects.filter(i => i != statusEffect.name)
                            print(`${characters.player.name} lost status effect ${statusEffect.name}.`, false, true)
                        }
                    }
                });

                if(health != 0){
                    if(isViewer){
                        characters.twitch_chat.health += health
                        Math.min(characters.twitch_chat.health, characters.twitch_chat.max_health)
                        print(`${characters.twitch_chat.name} ${health > 0 ? "gained" : "lost"} ${Math.abs(health)} health points.`, false, true)

                        if(characters.twitch_chat.health <= 0){
                            print("-------------------------", false, true)
                            print(`${characters.twitch_chat.name} has died. Game over.`)
                            print("You can start a new game by refreshing the page.", false, true)
                            state = "none"
                        }
                    }else{
                        characters.player.health += health
                        Math.min(characters.player.health, characters.player.max_health)
                        print(`${characters.player.name} ${health > 0 ? "gained" : "lost"} ${Math.abs(health)} health points.`)

                        if(characters.player.health <= 0){
                            print("-------------------------", false, true)
                            print(`${characters.player.name} has died. Game over.`)
                            print("You can start a new game by refreshing the page.", false, true)
                            state = "none"
                        }
                    }
                }

                if(max_health != 0){
                    if(isViewer){
                        characters.twitch_chat.max_health += max_health
                        print(`${characters.twitch_chat.name} ${max_health > 0 ? "gained" : "lost"} ${Math.abs(max_health)} max health points.`, false, true)

                        // make sure health does not exceed max health
                        characters.twitch_chat.health = Math.min(characters.twitch_chat.health, characters.twitch_chat.max_health)

                        // if health is 0, the player dies
                        if(characters.twitch_chat.health <= 0){
                            print("-------------------------", false, true)
                            print(`${characters.twitch_chat.name} has died. Game over.`)
                            print("You can start a new game by refreshing the page.", false, true)
                            state = "none"
                        }
                    }else{
                        characters.player.max_health += max_health
                        print(`${characters.player.name} ${max_health > 0 ? "gained" : "lost"} ${Math.abs(max_health)} max health points.`, false, true)

                        // make sure health does not exceed max health
                        characters.player.health = Math.min(characters.player.health, characters.player.max_health)

                        // if health is 0, the player dies
                        if(characters.player.health <= 0){
                            print("-------------------------", false, true)
                            print(`${characters.player.name} has died. Game over.`)
                            print("You can start a new game by refreshing the page.", false, true)
                            state = "none"
                        }
                    }
                }

                if(gold != 0){
                    if(isViewer){
                        characters.twitch_chat.gold += gold

                        characters.twitch_chat.gold = Math.max(characters.twitch_chat.gold, 0)
                        print(`${characters.twitch_chat.name} &6${gold > 0 ? "gained" : "lost"} ${Math.abs(gold)} gold.&f`, false, true)
                    }else{
                        characters.player.gold += gold

                        characters.player.gold = Math.max(characters.player.gold, 0)
                        
                        print(`${characters.player.name} &6${gold > 0 ? "gained" : "lost"} ${Math.abs(gold)} gold.&f`, false, true)
                    }
                }

                // make sure stats is a valid object
                if(stats && typeof stats == "object"){
                    for (const [key, value] of Object.entries(stats)) {
                        // check if stat value is not 0
                        if (value != 0) {

                            if(isViewer){
                                // check if the stat exists, if not, create it
                                if(!characters.twitch_chat.stats[key]){
                                    characters.twitch_chat.stats[key] = 0
                                }
                                characters.twitch_chat.stats[key] += value
                                print(`${characters.twitch_chat.name} ${value > 0 ? "gained" : "lost"} ${Math.abs(value)} ${key}.`, false, true)
                            }else{
                                // check if the stat exists, if not, create it
                                if(!characters.player.stats[key]){
                                    characters.player.stats[key] = 0
                                }
                                characters.player.stats[key] += value
                                print(`${characters.player.name} ${value > 0 ? "gained" : "lost"} ${Math.abs(value)} ${key}.`, false, true)
                            }
                        }
                    }
                }
                    


                abilities.forEach(ability => {
                    if(ability.action == "gained"){
                        if(isViewer){
                            characters.twitch_chat.abilities.push({name: ability.name, description: ability.description})
                            print(`${characters.twitch_chat.name} gained a new ability, ${ability.name} - ${ability.description}.`, false, true)
                        }else{
                            characters.player.abilities.push({name: ability.name, description: ability.description})
                            print(`${characters.player.name} gained a new ability, ${ability.name} - ${ability.description}.`, false, true)
                        }
                    }else if(ability.action == "lost"){
                        if(isViewer){
                            characters.twitch_chat.abilities = characters.twitch_chat.abilities.filter(i => i != ability.name)
                            print(`${characters.twitch_chat.name} lost the ability ${ability.name}.`, false, true)
                        }else{
                            characters.player.abilities = characters.player.abilities.filter(i => i != ability.name)
                            print(`${characters.player.name} lost the ability ${ability.name}.`, false, true)
                        }
                    }
                });

                if(callback){
                    callback()
                }
            });
        }
    }



    
    function GetPlayerCharacterInfo(isViewer){
        // return a string containing the player's character info, such as name, inventory, and status effects
        let info = ""
        if(isViewer){
            let name = characters.twitch_chat.name
            let description = characters.twitch_chat.description
            let health = characters.twitch_chat.health || 5
            let max_health = characters.twitch_chat.max_health || 5

            let stats = ""
            stats += `HP: ${health}/${max_health}\n`
            // loop through stats key value pairs
            for (const [key, value] of Object.entries(characters.twitch_chat.stats)) {
                stats += `${key}: ${value}\n`
            }

            let inventory = ""
            characters.twitch_chat.inventory.forEach(item => {
                inventory += `${item.name} - ${item.description}\n`
            });

            let gold = characters.twitch_chat.gold || 0

            if(gold > 0){
                inventory += `&6${gold} gold&f\n`
            }

            if(inventory.length == 0){
                inventory = "None"
            }

            let statusEffects = ""
            characters.twitch_chat.status_effects.forEach(statusEffect => {
                statusEffects += `${statusEffect.name} - ${statusEffect.description}\n`
            });
            if(statusEffects.length == 0){
                statusEffects = "None"
            }

            let abilities = ""
            characters.twitch_chat.abilities.forEach(ability => {
                abilities += `${ability.name} - ${ability.description}\n`
            });
            if(abilities.length == 0){
                abilities = "None"
            }

            info = `${name} - ${description}\n\nStats:\n${stats}\nInventory:\n${inventory}\nStatus Effects:\n${statusEffects}\n\nAbilities:\n${abilities}`

        }else{
            let name = characters.player.name
            let description = characters.player.description
            let health = characters.player.health || 5
            let max_health = characters.player.max_health || 5

            let stats = ""
            stats += `HP: ${health}/${max_health}\n`
            // loop through stats key value pairs
            for (const [key, value] of Object.entries(characters.player.stats)) {
                stats += `${key}: ${value}\n`
            }

            let gold = characters.player.gold || 0

            let inventory = ""
            characters.player.inventory.forEach(item => {
                inventory += `${item.name} - ${item.description}\n`
            });

            if (gold > 0) {
                inventory += `&6${gold} gold&f\n`
            }

            if(inventory.length == 0){
                inventory = "None"
            }

            let statusEffects = ""
            characters.player.status_effects.forEach(statusEffect => {
                statusEffects += `${statusEffect.name} - ${statusEffect.description}\n`
            });
            if(statusEffects.length == 0){
                statusEffects = "None"
            }

            let abilities = ""
            characters.player.abilities.forEach(ability => {
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
        // ask the AI to compress the text to the most important parts, then add it to the history. make sure it keeps it to roughly 50 - 100 words.
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
                model: gptModelSelect.value || 'gpt-4o-mini',
                messages: [{role: 'system', content: prompt}, {role: role, content: text}],
                max_tokens: 200
            };

            const response = await GPTRequest(endpoint, apiKey, body);

            if (response.status === 200) {
                let output = "";
                HandleStream(response.body, (text) => {
                    output += text
                }
                , () => {
                    // parse json
                    let data = JSON.parse(output)
                    let compressed = data.choices[0].message.content
                    // add the compressed text to the history
                    AddToHistory(compressed, role)
                    console.log("Added to history: " + compressed)
                    resolve()
                });
            }
        })
    }

    async function runGameLoop(){
        // if viewer turn, generate things they can vote to do next.
        if(state == "viewer_turn"){
            toggleInput(false)
            let endpoint = `v1/chat/completions`
            let prompt = gptBasePrompt + ` The theme of the game is ${theme}. You are generating vote options for the player's next move. Please provide 5 options for the player to choose from, keep these options under 25 words, do not add additional story info, ONLY reply with the options.`
            const body = {
                model: gptModelSelect.value || 'gpt-4o-mini',
                messages: [{role: 'system', content: prompt}, ...history, {role: 'user', content: "generate the options"}],
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

            
            const response = await GPTRequest(endpoint, apiKey, body);

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
                        voteOptions.push({text: option.trim()})
                    });

                    print("-------------------------", false, true)
                    print(`Viewers, please vote for the next move.`)
                
                    toggleInput(false)
                    StartTwitchVote(voteOptions, parseInt(voteTime.value), async (winner) => {
                        print(`${characters.twitch_chat.name} decides to ${winner.text}`)

                        print("-------------------------", false, true)
                        
                        // generate the AI response to the player's move
                        let endpoint = `v1/chat/completions`
                        let prompt = gptBasePrompt + `The theme of the game is ${theme}. Please respond to ${characters.twitch_chat.name}'s move, continue the story from where they left off, using the move as a reference for what they are doing. Do not lead the player, let them decide what to do next. Don't give them options. Do not ask them for their next move.  Do not display their stats in your response.`
                        
                        
                        
                        const body = {
                            model: gptModelSelect.value || 'gpt-4o-mini',
                            messages: [{role: 'system', content: prompt}, ...history, {role: 'assistant', content: GetPlayerCharacterInfo(true)}, {role: 'user', content: `${characters.twitch_chat.name} decides to ${winner.text}`}],
                            stream: true,
                        };

                        compressAndAddToHistory( `${characters.twitch_chat.name} decides to ${winner.text}`, "user")

                        toggleInput(false)
                        const response = await GPTRequest(endpoint, apiKey, body);

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
                                if(aiImages.checked){
                                    await asyncGenerateImage(output)
                                }
                                toggleInput(true)

                                
                 
                                compressAndAddToHistory( output, "assistant")
                                print(output)
                                print("-------------------------", false, true)

                                waitForKeypress(async () => {
                                    toggleInput(false)
                                    checkForChanges(output, true, () => {
                                        print("-------------------------", false, true)
                                        // check if the streamer is participating
                                        if(streamerParticipates.checked){
                                            // tell the streamer it's their turn
                                            print(`Streamer, it's your turn. Please type your move.`)
                                            state = "streamer_turn"
                                            toggleInput(true)
                                        }else
                                        {
                                            print("Player, please choose your next move by typing anything, such as 'look around' or 'go north'.")
                                            state = "viewer_turn"
                                            runGameLoop()
                                        }

                                    })
                                    
                                })
                            });
                        }



                    })
                });
            }

        }
    }

    async function startViewerCharacterSelection(prunedHistory){
        // if prunedHistory is not set, set it to the history
        if(!prunedHistory){
            prunedHistory = [...history]

            // remove last entry
            prunedHistory.pop()
        }

        // generate viewerCharacterSelectionFlow options using AI
        /*
        "Race",
        "Class",
        "Background",
        "Alignment",
        "Name",
        */
        let endpoint = `v1/chat/completions`
        let prompt = gptBasePrompt + `The theme of the game is ${theme}. You are generating the character creation flow, Please provide a list of character selection options to go through, based on the theme. do not add additional story info, ONLY reply with the options.
        Examples:
        Theme: Fantasy
        Output: ["Race", "Class", "Background", "Alignment"]
        Theme: Sci-Fi
        Output: ["Species", "Class", "Background", "Alignment"]
        `

        const body = {
            model: gptModelSelect.value || 'gpt-4o-mini',
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


        const response = await GPTRequest(endpoint, apiKey, body);

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

                viewerCharacterSelectionFlow = flow.flow

                // if viewerCharacterSelectionFlow does not contain "name", add it
                if(!viewerCharacterSelectionFlow.includes("Name") && !viewerCharacterSelectionFlow.includes("name")){
                    viewerCharacterSelectionFlow.push("Name")
                }

                viewerCharacterSelectionState = 0
                viewerCharacterSelection(prunedHistory)
        
            });
        }

    }

    async function generateCharacterDescription(description, isViewer){
        // summarize the description down to 50 words or less.
        // leave out any details such as items and things like that.
        // use AI to generate the summary
        let endpoint = `v1/chat/completions`
        let prompt = gptBasePrompt + `The theme of the game is ${theme}. Summarize the given character in 50 words or less, leave out any story details, and items. Only include details about the character itself. DO NOT INCLUDE ITEMS OR STORY DETAILS, Do not ask for the next move, do not give options. This is just a small description of the character.`
        const body = {
            model: gptModelSelect.value || 'gpt-4o-mini',
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

        const response = await GPTRequest(endpoint, apiKey, body);

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
                    characters.twitch_chat.description = output
                }else{
                    characters.player.description = output
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
            model: gptModelSelect.value || 'gpt-4o-mini',
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
        
        const response = await GPTRequest(endpoint, apiKey, body);

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
                    characters.twitch_chat.description = data.description
                    characters.twitch_chat.health = data.health
                    characters.twitch_chat.max_health = data.max_health
                    characters.twitch_chat.gold = data.gold
                    characters.twitch_chat.inventory = data.inventory
                    characters.twitch_chat.status_effects = data.status_effects
                    characters.twitch_chat.abilities = data.abilities
                    characters.twitch_chat.stats = {
                        strength: data.strength,
                        dexterity: data.dexterity,
                        constitution: data.constitution,
                        intelligence: data.intelligence,
                        wisdom: data.wisdom,
                        charisma: data.charisma
                    }
                

                }else{
                    characters.player.description = data.description
                    characters.player.health = data.health
                    characters.player.max_health = data.max_health
                    characters.player.gold = data.gold
                    characters.player.inventory = data.inventory
                    characters.player.status_effects = data.status_effects
                    characters.player.abilities = data.abilities
                    characters.player.stats = {
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
        // have the AI generate different options for the viewers to pick from, and go through the viewerCharacterSelectionFlow

        // clear vote
        viewerVotes = []
        activeVote = null
        activeVoteEntry = null

        let endpoint = `v1/chat/completions`
        let prompt = gptBasePrompt + ` The theme of the game is ${theme}. You are generating vote options for the player's ${viewerCharacterSelectionFlow[viewerCharacterSelectionState]}. Their character so far is ${characters.twitch_chat.description}. Please provide 5 options for the player to choose from, keep these options under 25 words, do not add additional story info, ONLY reply with the options.`
        const body = {
            model: gptModelSelect.value || 'gpt-4o-mini',
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
        
        let isName = viewerCharacterSelectionFlow[viewerCharacterSelectionState].toLowerCase() == "name"

        const response = await GPTRequest(endpoint, apiKey, body);

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
                    voteOptions.push({text: option.trim()})
                });

                print("-------------------------", false, true)
                print(`Viewers, please vote for the ${viewerCharacterSelectionFlow[viewerCharacterSelectionState]} of your character.`)

                StartTwitchVote(voteOptions, parseInt(voteTime.value), async (winner) => {
                    characters.twitch_chat.description += `${viewerCharacterSelectionFlow[viewerCharacterSelectionState]}: ${winner.text}\n`

                    if (isName){
                        characters.twitch_chat.name = winner.text
                    }

                    viewerCharacterSelectionState++
                    print(`Viewers have chosen "${winner.text}."`)
                    if(viewerCharacterSelectionState < viewerCharacterSelectionFlow.length){
                        waitForKeypress(async () => {
                            viewerCharacterSelection(prunedHistory)
                        })
                    }else{
                        // have the AI summarize the character
                        let endpoint = `v1/chat/completions`
                        let prompt = gptBasePrompt + ` The theme of the game is ${theme}. Please summarize the character, add additional details if necessary. You may also give the player some starting items.`
                        const body = {
                            model: gptModelSelect.value || 'gpt-4o-mini',
                            messages: [{role: 'system', content: prompt}, ...prunedHistory, {role: 'user', content: characters.twitch_chat.description}],
                            stream: true,
                        };

                        const response = await GPTRequest(endpoint, apiKey, body);

                        if (response.status === 200) {
                            compressAndAddToHistory( characters.twitch_chat.description, "user")
                            prunedHistory.push({content: characters.twitch_chat.description, role: "user"})
                            let msg = print(`test`, false, true);
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
                                            outputDiv.scrollTop = outputDiv.scrollHeight;
                                        }
                                    }
                                    
                                } catch (e) {
                                    console.log(text)

                                }
                               

                            }, async () => {
                                toggleInput(false)
                                if(aiImages.checked){
                                    await asyncGenerateImage(characters.twitch_chat.description)
                                }
                                

                                await asyncParseCharacterStats(output, true)
                                toggleInput(true)
                                // print character info
                                print("-------------------------", false, true)
                                print(`Your character, ${characters.twitch_chat.name}, has been created. Here are the details:`, false, true)
                                print(GetPlayerCharacterInfo(true), false, true)
                                print("-------------------------", false, true)

                                waitForKeypress(async () => {
                                    compressAndAddToHistory( output, "assistant")
                                    if(ttsText.length > 0){
                                        TryToSpeak(ttsText)
                                    }

             
                                    
                                    toggleInput(true)
                                    // check if the streamer is participating
                                    if(streamerParticipates.checked){
                                        state = "streamer_turn"
                                        print("To start your adventure, type anything you like, such as 'look around' or 'go north'.")
                                        print("You may also check your characters by typing 'info'.")                                        
                                    }else{
                                        state = "viewer_turn"

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

        if(state == "none"){
            if (command === 'start') {
                if(await checkSettings()){
                    state = "theme"
                }
            }
        }
        else if(state == "theme"){
            theme = input;
            // have the AI generate a starting setting
            let endpoint = `v1/chat/completions`
            let prompt = gptBasePrompt + ` The theme of the game is ${theme}. Please give a brief description the starting location and situation. Note you do not know the player's name, race, or anything about them yet. Do not include any player specific information. The player will pick their character after this. Keep it brief, at the end ask the player to describe their character, make sure to segway into it smoothly.`
            const body = {
                model: gptModelSelect.value || 'gpt-4o-mini',
                messages: [{role: 'system', content: prompt}, {role: 'user', content: "Please describe the starting location and situation."}],
                stream: true,
            };


            const response = await GPTRequest(endpoint, apiKey, body);
            if (response.status === 200) {
                let msg = print(`test`, false, true);
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
                                outputDiv.scrollTop = outputDiv.scrollHeight;
                            }
                        }
                        
                    } catch (e) {
                        //console.log(text)

                    }
                   

                }, async () => {
                    toggleInput(false)
                    if(aiImages.checked){
                        await asyncGenerateImage(output)
                    }
                    toggleInput(true)

                    compressAndAddToHistory( output, "assistant")

                    if(ttsText.length > 0){
                        TryToSpeak(ttsText)
                    }
                    //print("Player, please describe your character, in as much detail as you like.")
                    // check if twitch a twitch channel is set
                    if(twitchChannel && twitchChannel.length > 0){
                        if(streamerParticipates.checked){
                            state = "character"
                            toggleInput(true)
                            print("-------------------------", false, true)
                            print(`Streamer, please describe your character, in as much detail as you like. Your viewers will pick their character after you.`)
                        }else{
                            toggleInput(false)
                            state = "viewer_character_selection"
                            startViewerCharacterSelection()
                        }
                    }else{
                        state = "character"
                        print("-------------------------", false, true)
                        print("Player, please describe your character, in as much detail as you like.")
                        toggleInput(true)
                    }
                

                });
            }


            
        }
        else if(state == "character"){
            characters.player.description = input;
            toggleInput(true)
            print("-------------------------", false, true)
            state = "name"
            print("Please give your character's name.")
        }
        else if (state == "name"){
            characters.player.description += ` Name: ${input}\n`
            characters.player.name = input

            let endpoint = `v1/chat/completions`
            let prompt = gptBasePrompt + ` The theme of the game is ${theme}. Please summarize the character, add additional details if necessary. You may also give the player some starting items.`

            // check if
            if(twitchChannel && twitchChannel.length > 0){
                prompt = prompt + ` end with "I see you have someone with you, who is that?"`
            }else{
                prompt = prompt + ` end by asking the player what they wish to do next, with a little bit more story info.`
            }

            const body = {
                model: gptModelSelect.value || 'gpt-4o-mini',
                messages: [{role: 'system', content: prompt}, ...history, {role: 'user', content: characters.player.description}],
                stream: true,
            };
            

            const response = await GPTRequest(endpoint, apiKey, body);

            if (response.status === 200) {

                let msg = print(`test`, false, true);
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
                                outputDiv.scrollTop = outputDiv.scrollHeight;
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
                    if(aiImages.checked){
                        await asyncGenerateImage(characters.player.description)
                    }
                    
                    //generateCharacterDescription(output, false)

                    await asyncParseCharacterStats(output, false)
                    toggleInput(true)
                    // print character info
                    print("-------------------------", false, true)
                    print(`Your character, ${characters.player.name}, has been created. Here are the details:`, false, true)
                    print(GetPlayerCharacterInfo(false), false, true)

                    print("-------------------------", false, true)
                    //checkForChanges(output, false, () => {

                        
                        if(twitchChannel && twitchChannel.length > 0){
                            waitForKeypress(async () => {
                                state = "viewer_character_selection"
                                startViewerCharacterSelection()
                            })
                        }else{
                            toggleInput(true)
                            state = "streamer_turn"
                            print("To start your adventure, type anything you like, such as 'look around' or 'go north'.")
                            print("You may also check your character by typing 'info'.")
                        }       
                    //})
             
                });
            }
        }
        else if (state == "streamer_turn"){

            // check if streamer just said "info"
            if(input.toLowerCase() == "info"){
                print(GetPlayerCharacterInfo(false), false, true)
                // if twitch chat is playing too, show their info
                if(twitchChannel && twitchChannel.length > 0){
                    print("-------------------------", false, true)
                    print(GetPlayerCharacterInfo(true), false, true)
                }
                print("-------------------------", false, true)
                
            }else{
                print(`${characters.player.name} decides to ${input}`, false, true)

                viewerTurn = false
                print("-------------------------", false, true)
                
                // generate the AI response to the player's move
                let endpoint = `v1/chat/completions`
                let prompt = gptBasePrompt + ` The theme of the game is ${theme}. Please respond to ${characters.player.name}'s move, continue the story from where they left off, using the move as a reference for what they are doing. Do not lead the player, let them decide what to do next. Don't give them options. Do not ask them for their next move. Do not display their stats in your response.`
                const body = {
                    model: gptModelSelect.value || 'gpt-4o-mini',
                    messages: [{role: 'system', content: prompt}, ...history, {role: 'assistant', content: GetPlayerCharacterInfo(true)}, {role: 'user', content: `${characters.player.name} decides to ${input}`}],
                    stream: true,
                };

                
                compressAndAddToHistory( `${characters.player.name} decides to ${input}`, "user")
                toggleInput(false)
                const response = await GPTRequest(endpoint, apiKey, body);

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
                        if(aiImages.checked){
                            await asyncGenerateImage(output)
                        }
                        toggleInput(true)
             
                        compressAndAddToHistory( output, "assistant")
                        print(output)
                       
                        checkForChanges(output, false, () => {
                            print("-------------------------", false, true)
                            // check if we are doing twitch viewer participation
                            if(twitchChannel && twitchChannel.length > 0){
                                waitForKeypress(async () => {
                                    toggleInput(false)
                                    state = "viewer_turn"
                                    runGameLoop()
                                })
                            }
                        });
                
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
});