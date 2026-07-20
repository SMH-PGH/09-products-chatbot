function initChat() {
    const chatToggle = document.getElementById('chatToggle');
    const chatBox = document.getElementById('chatBox');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const openIcon = document.querySelector('.open-icon');
    const closeIcon = document.querySelector('.close-icon');
    const chatForm = document.getElementById('chatForm');
    let rentals = [];

    const conversation = [];

    function buildSystemPrompt(rentalData) {
        return `You are the Offbeat Assistant for a vacation rental website.
Use the rentals data below when helping the user.
Guide the user through a short conversation by asking 2 to 3 simple questions if needed, such as preferred vibe, location, or style.
Once you have enough information, recommend the best matching rentals from the list.
Recommend the top matches based on the user's answers.
Format your response with short paragraphs, line breaks, or bullets so it is easy to read.
Keep the tone friendly, natural, and conversational.

Rentals data:
${JSON.stringify(rentalData, null, 2)}`;
    }

    function scrollMessagesToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addMessage(role, text) {
        const message = document.createElement('div');
        message.classList.add('message', role === 'user' ? 'user' : 'bot');
        message.textContent = text;
        message.style.whiteSpace = 'pre-line';
        chatMessages.appendChild(message);
        scrollMessagesToBottom();
    }

    async function loadRentals() {
        const response = await fetch('./rentals.json');
        if (!response.ok) {
            throw new Error('Failed to load rentals');
        }

        const data = await response.json();
        rentals = data.rentals || [];
        conversation.push({ role: 'system', content: buildSystemPrompt(rentals) });
        conversation.push({
            role: 'assistant',
            content: 'What kind of offbeat stay are you looking for? Tell me your vibe, favorite location, or any must-have theme.'
        });
        const initialMessage = chatMessages.querySelector('.message.bot');
        if (initialMessage) {
            initialMessage.textContent = 'What kind of offbeat stay are you looking for? Tell me your vibe, favorite location, or any must-have theme.';
            initialMessage.style.whiteSpace = 'pre-line';
        } else {
            addMessage('assistant', 'What kind of offbeat stay are you looking for? Tell me your vibe, favorite location, or any must-have theme.');
        }
    }

    async function getAssistantReply() {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: conversation,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('OpenAI request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    chatToggle.addEventListener('click', function() {
        chatBox.classList.toggle('active');
        openIcon.style.display = chatBox.classList.contains('active') ? 'none' : 'block';
        closeIcon.style.display = chatBox.classList.contains('active') ? 'block' : 'none';
    });

    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const message = userInput.value.trim();
        if (!message) {
            return;
        }

        userInput.value = '';
        conversation.push({ role: 'user', content: message });
        addMessage('user', message);

        try {
            const assistantReply = await getAssistantReply();
            conversation.push({ role: 'assistant', content: assistantReply });
            addMessage('assistant', assistantReply);
        } catch (error) {
            addMessage('assistant', 'Sorry, I could not connect to the chat service right now.');
        }
    });

    loadRentals().catch(function() {
        addMessage('assistant', 'Sorry, I could not load the rental catalog right now.');
    });
}

initChat();
