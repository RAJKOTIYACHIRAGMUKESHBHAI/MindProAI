
const otpPage = document.getElementById('otp-page');
const loginPage = document.getElementById('login-page');
const chatPage = document.getElementById('chat-page');

const msgInput = document.getElementById('msg-input');
const messageArea = document.getElementById('message-area');
const sessionList = document.getElementById('session-list');
let isVoiceMode = false; // By default voice mode off rahega
let recognition = null;

let allChatSessions = []; // 🔥 Yeh database ki saari chats ka backup rakhega
  let chatSessions = [];// Yeh sirf current tier ki chats dikhayega
let currentTier = 'basic'; // Default tier


let currentSessionId = null;
let allMessagesArray = []; // Start mein khali
 // Default mein false rakhein

// 1. Teeno tiers ke chat messages ki memory (localStorage ke saath)
let chatPanels = {
    basic: localStorage.getItem('mindpro_messages_basic') || '',
    advance: localStorage.getItem('mindpro_messages_advance') || '',
    pro: localStorage.getItem('mindpro_messages_pro') || ''
};

let currentTier = 'basic'; // Default shuruat hamesha basic se hogi
let isPremiumUser = false; // Subscription check ke liye

// 2. Message Limits ke Counters
let advanceMessageCounter = parseInt(localStorage.getItem('advance_msg_counter')) || 0;
let proMessageCounter = parseInt(localStorage.getItem('pro_msg_counter')) || 0;

const MAX_ADVANCE_MESSAGES = 5; // 5 message ki limit Advance ke liye
const MAX_PRO_MESSAGES = 3;    // 3 message ki limit Pro ke liye

// 3. Page Load hote hi Basic ka exact structure aur welcome bubble clone karne ke liye
window.addEventListener('DOMContentLoaded', () => {
    const chatDisplay = document.getElementById('chat-messages'); // <-- Apne chat messages wale container ki ID dekhna
    
    if (chatDisplay) {
        // Agar pehli baar website khuli hai, toh Basic ke andar jo original design aur bubble hai use sabme copy kar do
        if (!localStorage.getItem('mindpro_messages_basic') && chatDisplay.innerHTML.trim() !== '') {
            const initialBasicStructure = chatDisplay.innerHTML;
            chatPanels.basic = initialBasicStructure;
            chatPanels.advance = initialBasicStructure;
            chatPanels.pro = initialBasicStructure;
            
            localStorage.setItem('mindpro_messages_basic', initialBasicStructure);
            localStorage.setItem('mindpro_messages_advance', initialBasicStructure);
            localStorage.setItem('mindpro_messages_pro', initialBasicStructure);
        } else {
            // Agar pehle se chat history saved hai, toh wahi load karo
            chatDisplay.innerHTML = chatPanels[currentTier];
        }
    }
});


function selectVersion(tier) {
    const chatDisplay = document.getElementById('chat-messages');

    if (chatDisplay) {
        // 💾 1. Pehle current version ki chat messages ko browser memory me save karo
        chatPanels[currentTier] = chatDisplay.innerHTML;
        localStorage.setItem(`mindpro_messages_${currentTier}`, chatDisplay.innerHTML);
    }

    // 🔄 2. Version badlein

    if (chatDisplay) {
        // 🚀 3. Naye version ki chat load karo (Yeh hamesha basic jaisa hi dikhega)
        chatDisplay.innerHTML = chatPanels[currentTier] || '';
    }

    // Sidebar ka Text aur Color update karne ke liye (Bina structure chhede)
    const title = document.getElementById('current-version-title');
    if (title) {
        if (tier === 'basic') {
            title.innerText = "Mind-pro Basic";
            title.style.color = "#4ade80";
        } else if (tier === 'advance') {
            title.innerText = "Mind-pro Advance";
            title.style.color = "#3b82f6";
        } else if (tier === 'pro') {
            title.innerText = "Mind-pro Pro";
            title.style.color = "#a855f7";
        }
    }

    setupChatsForCurrentTier();

    toggleVersionMenu(); // Hamburger Dropdown Menu close karein
}
// ==========================================
// 3. CHAT HISTORY (Fixes Login/Logout Persistence)
// ==========================================



// Menu ko kholne aur band karne ka function
function toggleVersionMenu(event) {
    if (event) event.stopPropagation(); // Click ko baaki window par failne se rokega
    const menu = document.getElementById('version-menu');
    
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block'; // Click karne par show hoga
    } else {
        menu.style.display = 'none'; // Dubara click karne par hide ho jayega
    }
}

// Agar user menu ke bahar kahi bhi click kare toh menu automatic band ho jaye
window.addEventListener('click', function(event) {
    const menu = document.getElementById('version-menu');
    const toggleBtn = document.getElementById('menu-toggle');
    
    if (menu && menu.style.display === 'block' && !menu.contains(event.target) && event.target !== toggleBtn) {
        menu.style.display = 'none';
    }
});
async function loadStoredChats(email) {
    if (!email) return;
    try {
        const response = await fetch('http://localhost:3000/get-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        if (!response.ok) {
            throw new Error('Server returned an error');
        }
        const data = await response.json();
        console.log("Server Response Data:", data);

        if (data.success && Array.isArray(data.chats)) {
            // 1. Saari chats ko Master backup list me save karo
            allChatSessions = data.chats; 
            
            // 2. Current tier ki chats ko screen par load karne wala function call karo
            setupChatsForCurrentTier();
        }
        else {
            console.log("No previous history found on server.");
            allChatSessions = [];
            chatSessions = [];
            createNewChat();
        }

    } catch (error) {
        console.error("Frontend loading error:", error);
    }
} 


function setupChatsForCurrentTier() {
    // Master list me se sirf current tier ki chats filter karo
    chatSessions = allChatSessions.filter(session => {
        const savedTier = session.tier || 'basic'; // Agar tier nahi hai to basic maan lo
        return savedTier === currentTier;
    });

    // Agar is tier me pehle se koi chat banti hui hai to use restore karo
    if (chatSessions.length > 0) {
        console.log(`History found for ${currentTier}! Restoring chats...`);
        currentSessionId = chatSessions[0].id;
        renderSidebar();
        renderMessages();
    } 
    // 🔥 AGAR KOI CHAT NAHI HAI, TO EKDOM FRESH NEW CHAT SE START KARO!
    else {
        console.log(`No previous history found for ${currentTier}. Starting fresh new chat.`);
        chatSessions = [];
        createNewChat();
    }
}


// ==========================================
// 1. DATABASE SYNC FUNCTIONS
// ==========================================
async function syncWithDB() {
    const email = localStorage.getItem('userEmail');
    if (!email || chatSessions.length === 0) return;

    try { // <--- Ye 'try' aapne nahi likha tha
        const response = await fetch('http://localhost:3000/save-chats', { // <--- 'const response =' zaroori hai
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.toLowerCase().trim(),
                chats: chatSessions 
            })
        });
        
        const result = await response.json();
        console.log("✅ Sync Status:", result.success ? "Saved" : "Failed");
    } catch (err) { 
        console.error("❌ Sync Error:", err);
    }
}


// ==========================================
// 1. PAGE LOAD LOGIC (Fixed Async Error)
// ==========================================

window.onload = async () => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        // Hide Login, Show Chat
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('chat-page').style.display = 'flex';

        // Update Circle Avatar
        updateAvatar(savedEmail);
        updateUserUI(savedEmail);

        const avatarEle = document.getElementById('user-avatar');
        if (avatarEle && savedEmail) {
            avatarEle.innerText = savedEmail.charAt(0).toUpperCase();
        }
        // Load History
        await loadStoredChats(savedEmail);
    }

};
// ==========================================
// 2. AUTHENTICATION (Fixed Email & OTP Errors)
// ==========================================

function updateAvatar(email) {
    if (!email) return;
    const popupEmail = document.getElementById('popup-email');
    const avatar = document.getElementById('user-avatar');
    if (avatar && email) {
        const firstLetter = email.charAt(0).toUpperCase();
        avatar.innerText = firstLetter;
        if (avatar) {
            avatar.innerText = firstLetter;
        }

        if (popupEmail) {
            popupEmail.innerText = email;
        }

    }
}

// Toggle Profile Popup
function toggleProfilePopup() {
    const popup = document.getElementById('profile-popup');
    if (popup) {
        popup.style.display = (popup.style.display === 'block') ? 'none' : 'block';
    }
}


async function verifyOTP() {
    // Pehle elements ko variable mein lein
    const emailInput = document.getElementById('email-input').value.trim().toLowerCase();
    const otpInput = document.getElementById('otp-input');

    // Check karein ki elements null toh nahi hain (Error prevention)
    if (!emailInput || !otpInput) {
        console.error("HTML IDs 'email-input' ya 'otp-input' nahi mil rahi hain!");
        return;
    }

    const email = emailInput.trim().toLowerCase();
    const otp = otpInput.value.trim();

    if (!otp) {
        alert("Please enter OTP");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('userEmail', email);
            updateUserUI(email);
            showSuccessPopup();


            await loadStoredChats(email);
            console.log("Loading history...");

            renderSidebar();
            renderMessages();

            setTimeout(() => {
                document.getElementById('login-page').style.display = 'none';
                document.getElementById('chat-page').style.display = 'flex';
            }, 1000);
        } else {
            alert("Invalid OTP!");
        }
    } catch (error) {
        console.error("Login Error:", error);
    }

    // Circle Avatar Logic (First Letter)
    const avatarEle = document.getElementById('user-avatar');
    if (avatarEle && email) {
        avatarEle.innerText = email.charAt(0).toUpperCase();
    }

    document.getElementById('login-page').style.display = 'none';
    document.getElementById('chat-page').style.display = 'flex';

    // Purani chat load karein
    if (typeof loadStoredChats === "function") {
        await loadStoredChats(email);
    }
}

async function saveToDatabase() {
    const email = localStorage.getItem('userEmail');
    // Debugging ke liye console log lagayein
    console.log("Saving for:", email);
    console.log("Data to save:", chatSessions);

    if (!email || chatSessions.length === 0) {
        console.log("You are not save to any data!");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/save-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                chats: chatSessions
            })
        });
        const resData = await response.json();
        console.log("Server Response:", resData);
    } catch (err) {
        console.error("Save failed:", error);
    }
}

async function sendOTP() {
    const emailInput = document.getElementById('email-input');
    const email = emailInput.value.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        alert("Please enter a VALID email address (example@gmail.com)");
        emailInput.focus();
        return;
    }

    const btn = document.querySelector('#step-1 button');
    const originalText = btn.innerText;

    btn.innerText = "Sending...";
    btn.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();

        if (data.success) {
            document.getElementById('step-1').style.display = 'none';
            document.getElementById('step-2').style.display = 'block';
        } else {
            alert("Error: " + (data.message || "Could not send OTP"));
        }
    } catch (e) {
        alert("Server not responding");
    }
    btn.innerText = originalText;
    btn.disabled = false;
}
// Logout function
function logout() {
    localStorage.clear();
    location.reload();
}

function showAuth(type) {
    if (document.getElementById('step-0')) document.getElementById('step-0').style.display = 'none';
    if (document.getElementById('step-1')) document.getElementById('step-1').style.display = 'block';

    if (type === 'login') {
        document.getElementById('auth-title').innerText = "Login";
        document.getElementById('auth-desc').innerText = "Enter registered email";
    } else {
        document.getElementById('auth-title').innerText = "New Signup";
        document.getElementById('auth-desc').innerText = "Create a new account";
    }
}


// ==========================================
// 3. CHAT LOGIC WITH AUTO-SAVE
// ==========================================
function createNewChat() {
    const newId = Date.now();
    document.getElementById('chat-word-search').value = "";
    const session = {
        id: newId,
        title: "New Conversation",
        tier: currentTier, // Naye session ke saath current tier bhi save karenge
        messages: [{ sender: 'ai', text: "Hello! I am Mind-pro AI. How can I help you?" }]
    };

    chatSessions.unshift(session);
    currentSessionId = newId;
    allChatSessions.unshift(newSession);

    renderSidebar();
    renderMessages();
    syncWithDB();
}

currentTier

// 1. Browser ke Speech Recognition ko initialize karein
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.interimResults = false; 
    recognition.lang = 'hi-IN'; 

    recognition.onresult = function(event) {
        const textSpoken = event.results[0][0].transcript;
        console.log("User ne bola:", textSpoken);
        
        const msgInput = document.getElementById('msg-input');
        if (msgInput) {
            msgInput.value = textSpoken;
            askAI(); // Automatic AI ko send karein
        }
    };

    recognition.onerror = function(event) {
        console.error("Speech recognition error:", event.error);
        const voiceToggleBtn = document.getElementById('voice-toggle-btn');
        if (isVoiceMode && voiceToggleBtn) {
            voiceToggleBtn.innerHTML = '🎙️';
        }
    };

    recognition.onend = function() {
        const voiceToggleBtn = document.getElementById('voice-toggle-btn');
        if (isVoiceMode && voiceToggleBtn) {
            voiceToggleBtn.innerHTML = '🔊'; 
        }
    };
} else {
    alert("⚠️ Aapka browser voice recognition support nahi karta. Please Google Chrome use karein.");
}

async function askAI()  {
    const msgInput = document.getElementById('msg-input'); // Apni input field ki ID verify kar lena
    if (!msgInput) return;
    const query = msgInput.value.trim();
    if (!query) return;

    // ⛔ MESSAGE LIMIT GATEKEEPER
    if (!isPremiumUser) {
        if (currentTier === 'advance') {
            if (advanceMessageCounter >= MAX_ADVANCE_MESSAGES) {
                alert("Our limit is expired, please subscribe this Brain! 🧠⚡");
                msgInput.value = ""; 
                if (typeof openPremiumModal === 'function') openPremiumModal();
                return; // Code yahi ruk jayega, message send nahi hoga
            }
            advanceMessageCounter++;
            localStorage.setItem('advance_msg_counter', advanceMessageCounter.toString());
        }
        
        else if (currentTier === 'pro') {
            if (proMessageCounter >= MAX_PRO_MESSAGES) {
                alert("Our limit is expired, please subscribe this Brain! 🧠💎");
                msgInput.value = ""; 
                if (typeof openPremiumModal === 'function') openPremiumModal();
                return; // Code yahi ruk jayega, message send nahi hoga
            }
            proMessageCounter++;
            localStorage.setItem('pro_msg_counter', proMessageCounter.toString());
        }
    }

    // Iske niche aapka purana fetch aur message append karne ka code jaisa hai vaisa hi rahega...

    const text = msgInput.value.trim();
    if (!text) return;

    let session = chatSessions.find(s => s.id === currentSessionId);
    if (!session) {
        createNewChat();
        session = chatSessions[0];
    }

    // User message push karein
    session.messages.push({ sender: 'user', text });
    msgInput.value = '';

    // Sidebar title update logic
    if (session.messages.length === 2) {
        session.title = text.length > 25 ? text.slice(0, 25) + "..." : text;
        renderSidebar();
    }

    renderMessages();
    
    // Database mein user ka message turant save karein
    await syncWithDB(); 

    // AI thinking state
    const loadingIndex = session.messages.push({ sender: 'ai', text: "Thinking..." }) - 1;
    renderMessages();

    updateEngineState('thinking');

    try {
        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: session.messages.slice(0, -1).map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }))
            })
        });

        const data = await response.json();
        
        // AI ka reply update karein
        session.messages[loadingIndex].text = data.reply;
        renderMessages();

        if (isVoiceMode) {
        speakAIResponse(data.reply);
    } else {
    // 🔥 Agar normal text message hai, toh response aate hi engine wapas Active ho jaye
    updateEngineState('active');
}

        // AI reply aane ke baad phir se database sync karein
        await syncWithDB(); 

    } catch (error) {
        session.messages[loadingIndex].text = "⚠️ Server connection failed.";
        console.error("AI Fetch Error:", error);
    }

    renderMessages();

     // ⛔ LIMIT GATEKEEPER
    if (!isPremiumUser) {
        if (currentTier === 'advance') {
            if (advanceMessageCounter >= MAX_ADVANCE_MESSAGES) {
                alert("Our limit is expired, please subscribe this Brain! 🧠⚡");
                msgInput.value = ""; 
                if (typeof openPremiumModal === 'function') openPremiumModal();
                return; // Code yahi ruk jayega, message send nahi hoga
            }
            advanceMessageCounter++;
            localStorage.setItem('advance_counter', advanceMessageCounter.toString());
        }
        
        else if (currentTier === 'pro') {
            if (proMessageCounter >= MAX_PRO_MESSAGES) {
                alert("Our limit is expired, please subscribe this Brain! 🧠💎");
                msgInput.value = ""; 
                if (typeof openPremiumModal === 'function') openPremiumModal();
                return; // Code yahi ruk jayega, message send nahi hoga
            }
            proMessageCounter++;
            localStorage.setItem('mindpro_pro_counter', proMessageCounter.toString());
        }
    }


}

// ==========================================
// 4. UI RENDER FUNCTIONS
// ==========================================
function renderSidebar() {
    if (!sessionList) return;
    if (!Array.isArray(chatSessions)) {
        chatSessions = [];
    }
    sessionList.innerHTML = '';
    chatSessions.sort((a, b) => (b.pinned || false) - (a.pinned || false));

    chatSessions.forEach(session => {
        const div = document.createElement('div');
        div.className = `chat-item ${session.id === currentSessionId ? 'active' : ''}`;

        const titleText = document.createElement('span');
        titleText.className = 'chat-title';
        titleText.innerText = (session.pinned ? '📍 ' : '') + session.title;

        titleText.onclick = () => {
            currentSessionId = session.id;
            renderSidebar();
            renderMessages();
        };

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'chat-actions';

        const pinBtn = document.createElement('button');
        pinBtn.innerHTML = session.pinned ? '🏷️' : '📌';
        pinBtn.onclick = (e) => {
            e.stopPropagation();
            session.pinned = !session.pinned;
            renderSidebar();
        };

        const delBtn = document.createElement('button');
        delBtn.innerHTML = '🗑️';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this chat?")) {
                chatSessions = chatSessions.filter(s => s.id !== session.id);
                if (currentSessionId === session.id) {
                    currentSessionId = chatSessions.length > 0 ? chatSessions[0].id : null;
                }
                renderSidebar();
                renderMessages();
            }
        };

        actionsDiv.appendChild(pinBtn);
        actionsDiv.appendChild(delBtn);
        div.appendChild(titleText);
        div.appendChild(actionsDiv);
        sessionList.appendChild(div);
    });
}
function renderMessages() {
    if (!messageArea) return;
    messageArea.innerHTML = '';

    const session = chatSessions.find(s => s.id === currentSessionId);
    if (!session) return;

    session.messages.forEach(msg => {
        const div = document.createElement('div');
        div.classList.add('message');
        div.classList.add(msg.sender === 'user' ? 'user-message' : 'ai-message');

        div.innerHTML = typeof marked !== 'undefined' ? marked.parse(msg.text) : msg.text;
        messageArea.appendChild(div);
    });

    messageArea.scrollTop = messageArea.scrollHeight;
}

// ==========================================
// 5. EVENT LISTENERS & UI HELPERS
// ==========================================
if (msgInput) {
    msgInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            askAI();
        }
    });
}

function showSuccessPopup() {
    const popup = document.getElementById('success-popup');
    if (popup) {
        popup.style.display = 'block';
        popup.classList.add('show');

        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => { popup.style.display = 'none'; }, 500);
        }, 3000);
    }
}

// 2. Button Click Listener
// Isko check karein ki ye kisi dusre function ke andar band na ho, bahar khula rahe
const voiceToggleBtn = document.getElementById('voice-toggle-btn');

if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener('click', () => {
        isVoiceMode = !isVoiceMode;
        
        if (isVoiceMode) {
            voiceToggleBtn.classList.add('active');
            voiceToggleBtn.innerHTML = '🔴'; 
         updateEngineState('listening');

            
            window.speechSynthesis.cancel(); 
            
            if (recognition) {
                try {
                    recognition.start(); 
                } catch(e) {
                    console.log("Recognition already started", e);
                }
            }
        } else {
            voiceToggleBtn.classList.remove('active');
            voiceToggleBtn.innerHTML = '🎙️';
               updateEngineState('active');
            
            if (recognition) recognition.stop();
            window.speechSynthesis.cancel(); 
        }
    });
}

// 3. AI ke bolne ka function (Isko alag se independent rakhein)
function speakAIResponse(text) {
    window.speechSynthesis.cancel();

    updateEngineState('speaking');

    const cleanText = text.replace(/[*#`_\-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'hi-IN'; 
    utterance.rate = 1.0;
    
    utterance.onend = function() {
        const voiceToggleBtn = document.getElementById('voice-toggle-btn');
        if (isVoiceMode && recognition) {
            if (voiceToggleBtn) voiceToggleBtn.innerHTML = '🔴'; 
            updateEngineState('listening');
            try {
                recognition.start(); 
            } catch(e) {
                console.log("Error restarting recognition:", e);
            }
        }else {
            // 🔥 Agar voice mode band ho chuka hai toh wapas normal Active state
            updateEngineState('active');
        }
    };
    
    window.speechSynthesis.speak(utterance);
}

// 1. Enter key handle karne wala function
function handleSearchEnter(event) {
    // Agar dabaayi gayi key 'Enter' hai
    if (event && event.key === 'Enter') {
        event.preventDefault(); // Page ko refresh hone se rokein
        
        console.log("Enter key pressed! Filtering now...");
        
        // Strictly main search function ko call karein aur event pass karein
        searchChatMessages(event); 
        
        // Input box se focus hatayein taaki keyboard band ho jaye
        document.getElementById('chat-word-search').blur(); 
    }
}
// 1. Enter key dabne par ye chalega
function handleSearchEnter(event) {
    if (event && event.key === 'Enter') {
        event.preventDefault(); // Page reload rokein
        console.log("Enter hit! Strict filtering starting...");
        
        searchChatMessages(event); // Main filter ko call karein
        document.getElementById('chat-word-search').blur(); // Input box se focus hatayein
    }
}
// 2. Main Search aur Filter Function
function searchChatMessages(event) {
    // Search box se value uthayein
    const searchQuery = document.getElementById('chat-word-search').value.toLowerCase().trim();
    
    // 🔥 Aapke HTML ke hisab se hum direct .chat-window ke andar ke messages dhoondhenge
    const chatWindow = document.querySelector('.chat-window');
    if (!chatWindow) {
        console.error("Oops! .chat-window elements nahi mila.");
        return;
    }

    // Aapke saare messages (chahe wo kisi bhi div me ho) unhe select karein
    // Agar aapke single message ki class '.message' ya '.chat-box' hai toh use niche sahi karein
    const allMessages = chatWindow.querySelectorAll('.message, .chat-box, [class*="message"]');

    // Agar search bar khali hai toh sab kuch wapas normal dikhao
    if (searchQuery === "") {
        allMessages.forEach(msgDiv => {
            msgDiv.style.display = ""; // Default display style par le aayein
        });
        return;
    }

    let firstMatchedMessage = null;

    // Strict Filtering Loop
    allMessages.forEach(msgDiv => {
        const messageText = msgDiv.textContent.toLowerCase();

        if (messageText.includes(searchQuery)) {
            msgDiv.style.display = ""; // Match hone par message dikhega
            
            if (!firstMatchedMessage) {
                firstMatchedMessage = msgDiv; // Pehla match track karein
            }
        } else {
            msgDiv.style.display = "none"; // 🚫 Jo match nahi hua wo strict HIDE!
        }
    });

    // Smooth scroll agar Enter dabaya gaya tha aur match mila
    if (event && event.key === 'Enter' && firstMatchedMessage) {
        firstMatchedMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function updateUserUI(email) {
    const avatarEle = document.getElementById('user-avatar');
    const popupEmail = document.getElementById('popup-email');
    if (avatarEle) avatarEle.innerText = email.charAt(0).toUpperCase();
    if (popupEmail) popupEmail.innerText = email;
}

const finalEmail = localStorage.getItem('userEmail');
if (finalEmail) {
    const avatar = document.getElementById('user-avatar');
    if (avatar) {
        avatar.innerText = finalEmail.charAt(0).toUpperCase();
    }
}

// Central Engine State Manager
function updateEngineState(state) {
    const engineText = document.getElementById('engine-text');
    const engineDot = document.getElementById('engine-dot');
    
    if (!engineText || !engineDot) return; // Guard clause agar elements na milein

    // Sabhi purane animation classes ko hatayein
    engineDot.className = "status-dot";

    switch(state) {
        case 'listening':
            engineText.innerText = "Engine: Listening...";
            engineText.style.color = "#eab308"; // Yellow Text
            engineDot.classList.add('listening-dot');
            break;
            
        case 'thinking':
            engineText.innerText = "Engine: Thinking...";
            engineText.style.color = "#3b82f6"; // Blue Text
            engineDot.classList.add('thinking-dot');
            break;
            
        case 'speaking':
            engineText.innerText = "Engine: Speaking...";
            engineText.style.color = "#a855f7"; // Purple Text
            engineDot.classList.add('speaking-dot');
            break;
            
        case 'active':
        default:
            engineText.innerText = "Engine: Active";
            engineText.style.color = "#4ade80"; // Wapas Green Text
            engineDot.classList.add('active-dot');
            break;
    }
}
