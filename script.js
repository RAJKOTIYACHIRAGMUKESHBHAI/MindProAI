
const otpPage = document.getElementById('otp-page');
const loginPage = document.getElementById('login-page');
const chatPage = document.getElementById('chat-page');

const msgInput = document.getElementById('msg-input');
const messageArea = document.getElementById('message-area');
const sessionList = document.getElementById('session-list');
let isVoiceMode = false;
let recognition = null;

let allChatSessions = []; 
let chatSessions = [];

let currentTier = localStorage.getItem('selectedTier') || 'basic';
let currentSessionId = null;
let allMessagesArray = []; 
let attachedDocText = "";  
let attachedDocName = "";

const uploadBtn = document.getElementById('doc-upload-btn');
const fileInput = document.getElementById('doc-file-input');

// 🛑 3. Upload Button Click Event (Crash-proof)
if (uploadBtn) {
    uploadBtn.addEventListener('click', (e) => {
        // Safe check: Agar tier basic hai toh file select mat karne do
        if (typeof currentTier !== 'undefined' && currentTier === 'basic') {
            e.preventDefault(); // 🛑 Label ke automatic click behavior ko rokega
            alert("🔒 Document upload is an Advance & Pro feature! Please switch to Advance or Pro Tier to analyze files.");
            return;
        }
        
        console.log("🔄 Opening file dialog...");
        // NOTE: fileInput.click() likhne ki zaroorat nahi hai, <label for="..."> khud handle kar lega!
    });
} else {
    // Agar element page par nahi hai (jaise login page par), toh code crash nahi hoga
    console.log("ℹ️ 'doc-upload-btn' element is page par nahi mila."); 
}

// 👁️ 4. Tier Visibility Checker (🔥 ERROR FIXED YAHAN HAI)
function checkUploadButtonVisibility(tier) {
    const btnToHideShow = document.getElementById('doc-upload-btn');
    
    if (btnToHideShow) {
        if (tier === 'advance' || tier === 'pro') {
            btnToHideShow.style.display = 'inline-flex'; // Advance/Pro me dikhega
            console.log("🟢 Premium Tier Detected: Upload Button Shown!");
        } else {
            btnToHideShow.style.display = 'none'; // Basic me chhup jayega
            console.log("🔴 Basic Tier Detected: Upload Button Hidden!");
        }
    }
}

// 2. File Input Change Event
const docFileInput = document.getElementById('doc-file-input');
if (docFileInput) {
    docFileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        attachedDocName = file.name;
        const reader = new FileReader();

    reader.onload = function (evt) {
        attachedDocText = evt.target.result; 

        const nameText = document.getElementById('doc-name-text');
        const previewBadge = document.getElementById('doc-preview-badge');

        if (nameText && previewBadge) {
            nameText.innerText = `📄 ${attachedDocName}`;
            previewBadge.style.display = 'flex';
            console.log("✅ 📄 Document successfully loaded into memory!");
        } else {
            console.error("❌ Error: UI elements ('doc-name-text' ya 'doc-preview-badge') nahi mile!");
        }
    };

    reader.readAsText(file);
    });
}

const clearDocBtn = document.getElementById('clear-doc-btn');
if (clearDocBtn) {
    clearDocBtn.addEventListener('click', () => {
        attachedDocText = "";
        attachedDocName = "";
        const docInput = document.getElementById('doc-file-input');
        if (docInput) docInput.value = "";
        const preview = document.getElementById('doc-preview-badge');
        if (preview) preview.style.display = 'none';
    });
}


let chatPanels = {
    basic: localStorage.getItem('mindpro_messages_basic') || '',
    advance: localStorage.getItem('mindpro_messages_advance') || '',
    pro: localStorage.getItem('mindpro_messages_pro') || ''
};


let isPremiumUser = false;


let advanceMessageCounter = parseInt(localStorage.getItem('advance_msg_counter')) || 0;
let proMessageCounter = parseInt(localStorage.getItem('pro_msg_counter')) || 0;

const MAX_ADVANCE_MESSAGES = 20;
const MAX_PRO_MESSAGES = 10;   

window.addEventListener('DOMContentLoaded', () => {
    const chatDisplay = document.getElementById('chat-messages'); 

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
  const chatDisplay = document.getElementById('message-area');


function selectVersion(tier) {
      // Check if user is trying to switch to premium without payment
      if ((tier === 'advance' || tier === 'pro') && currentTier === 'basic') {
            // Check subscription status
            const userSub = localStorage.getItem('userSubscription') || 'free';
            if (userSub === 'free') {
                  event.preventDefault();
                  alert(`📱 Upgrade to ${tier} for ₹${tier === 'advance' ? '150' : '300'}/month`);
                  openPaymentModal();
                  return;
            }
      }

      currentTier = tier;
      checkUploadButtonVisibility(currentTier);
  
      const chatDisplay = document.getElementById('message-area');
      if (chatDisplay) {
        chatPanels[currentTier] = chatDisplay.innerHTML;
        localStorage.setItem(`mindpro_messages_${currentTier}`, chatDisplay.innerHTML);
    }

    localStorage.setItem('selectedTier', tier);

    if (chatDisplay) {
        chatDisplay.innerHTML = chatPanels[currentTier] || '';
    }

    const title = document.getElementById('current-version-title');
    if (title) {
        if (tier === 'basic') {
            title.innerText = "Mind-pro Basic";
            title.style.color = "#4ade80";
        } else if (tier === 'advance') {
            title.innerText = "⚡ Mind-pro Advance";
            title.style.color = "#3b82f6";
        } else if (tier === 'pro') {
            title.innerText = "👑 Mind-pro Pro";
            title.style.color = "#a855f7";
        }
    }

    setupChatsForCurrentTier();
    toggleVersionMenu(); 
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
window.addEventListener('click', function (event) {
    const menu = document.getElementById('version-menu');
    const toggleBtn = document.getElementById('menu-toggle');

    if (menu && menu.style.display === 'block' && !menu.contains(event.target) && event.target !== toggleBtn) {
        menu.style.display = 'none';
    }
});
async function loadStoredChats(email) {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    try {
        const response = await fetch('http://localhost:3000/get-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, chats: chatSessions })
        });

        if (!response.ok) {
            throw new Error('Server returned an error');
        }
        const data = await response.json();
        console.log("Server Response Data:", data);

        if (data.success && Array.isArray(data.chats)) {
            allChatSessions = data.chats;

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
    chatSessions = allChatSessions.filter(session => {
        const savedTier = session.tier || 'basic';
        return savedTier === currentTier;
    });

    if (chatSessions.length > 0) {
        console.log(`History found for ${currentTier}! Restoring chats...`);
        currentSessionId = chatSessions[0].id;
        renderSidebar();
        renderMessages();
    }
    else {
        console.log(`No previous history found for ${currentTier}. Starting fresh new chat.`);
        chatSessions = [];
        createNewChat();
    }
}


async function syncWithDB() {
    const email = localStorage.getItem('userEmail');
    if (!email || chatSessions.length === 0) return;

    try {
        const response = await fetch('http://localhost:3000/save-chats', {
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


window.onload = async () => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('chat-page').style.display = 'flex';

        updateAvatar(savedEmail);
        updateUserUI(savedEmail);

        const avatarEle = document.getElementById('user-avatar');
        if (avatarEle && savedEmail) {
            avatarEle.innerText = savedEmail.charAt(0).toUpperCase();
        }
        await loadStoredChats(savedEmail);
    }

};

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

function toggleProfilePopup() {
    const popup = document.getElementById('profile-popup');
    if (popup) {
        popup.style.display = (popup.style.display === 'block') ? 'none' : 'block';
    }
}


async function verifyOTP() {
    const emailInput = document.getElementById('email-input').value.trim().toLowerCase();
    const otpInput = document.getElementById('otp-input');

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
        console.error("Save failed:", err);
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

function login() {
    const usernameInput = document.getElementById('username');
    if (!usernameInput) return;

    const username = usernameInput.value.trim();
    if (!username) {
        alert('Please enter your name to continue.');
        usernameInput.focus();
        return;
    }

    localStorage.setItem('userName', username);
    const namePage = document.getElementById('name-page');
    if (namePage) namePage.style.display = 'none';
    if (document.getElementById('login-page')) document.getElementById('login-page').style.display = 'flex';
}

// ==========================================
// 3. CHAT LOGIC WITH AUTO-SAVE
// ==========================================
function createNewChat() {
    console.log("Starting fresh new chat...");
    // 1. Sabse pehle search input field ko khali karein safely
    const searchInput = document.getElementById('chat-word-search');
    if (searchInput) searchInput.value = "";

    // 2. Ek unique ID generate karein
    const newSessionId = 'session_' + Date.now();

    // 3. Ek SINGLE correct session object banayein jisme greeting message ho
    const session = {
        id: newSessionId,
        title: "New Conversation",
        tier: typeof currentTier !== 'undefined' ? currentTier : 'advance',
        // Greeting message mandatory hai UI ke liye
        messages: [{ sender: 'ai', text: "Hello! I am Mind-pro AI. How can I help you?" }]
    };

    // 4. Safe check ke sath chatSessions array mein sabse upar push karein
    if (typeof chatSessions !== 'undefined' && Array.isArray(chatSessions)) {
        chatSessions.unshift(session);
    } else {
        chatSessions = [session];
    }

    // 5. Agar aapki file mein allChatSessions array bhi use hota hai, toh usme bhi push karein
    if (typeof allChatSessions !== 'undefined' && Array.isArray(allChatSessions)) {
        allChatSessions.unshift(session);
    }

    // 6. Active Global Session ID ko update karein
    currentSessionId = newSessionId;

    // 7. UI aur Database ko sirf EK baar call karke refresh karein
    if (typeof renderSidebar === 'function') renderSidebar();
    if (typeof renderMessages === 'function') renderMessages();
    if (typeof syncWithDB === 'function') syncWithDB();

    console.log("🚀 Fresh session successfully created with ID:", currentSessionId);
}



// 1. Browser ke Speech Recognition ko initialize karein
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN';

    recognition.onresult = function (event) {
        const textSpoken = event.results[0][0].transcript;
        console.log("User ne bola:", textSpoken);

        const msgInput = document.getElementById('msg-input');
        if (msgInput) {
            msgInput.value = textSpoken;
            askAI(); // Automatic AI ko send karein
        }
    };

    recognition.onerror = function (event) {
        console.error("Speech recognition error:", event.error);
        const voiceToggleBtn = document.getElementById('voice-toggle-btn');
        if (isVoiceMode && voiceToggleBtn) {
            voiceToggleBtn.innerHTML = '🎙️';
        }
    };

    recognition.onend = function () {
        const voiceToggleBtn = document.getElementById('voice-toggle-btn');
        if (isVoiceMode && voiceToggleBtn) {
            voiceToggleBtn.innerHTML = '🔊';
        }
    };
} else {
    alert("⚠️ Aapka browser voice recognition support nahi karta. Please Google Chrome use karein.");
}

async function askAI() {
    // 🎯 ID AUTO-DETECT: Dash wala ho ya bina dash wala, dono kaam karenge!
    const msgInput = document.getElementById('msgInput') || document.getElementById('msg-input'); 
    const sendBtn = document.getElementById('sendBtn') || document.getElementById('send-btn');

    // Agar input element hi nahi mila, toh console me error dikhega (silent return nahi hoga)
    if (!msgInput) {
        console.error("❌ Error: Na 'msgInput' mila na 'msg-input'. Apne HTML me text input ki ID check karein!");
        return;
    }

    const userMessageText = msgInput.value.trim();


    // Agar text bhi khali hai aur file bhi nahi hai, toh hi roko
    if (!userMessageText && (!attachedDocText || attachedDocText.trim() === "")) {
        return; 
    }

    // Double Click Rokne ke liye Input aur Button ko block karein
    if (sendBtn) sendBtn.disabled = true;
    msgInput.disabled = true;

    // ⛔ TIER MESSAGE LIMIT GATEKEEPER
    if (typeof isPremiumUser !== 'undefined' && !isPremiumUser) {
        if (currentTier === 'advance') {
            if (advanceMessageCounter >= MAX_ADVANCE_MESSAGES) {
                alert("Our limit is expired, please subscribe this Brain! 🧠⚡");
                msgInput.value = "";
                if (sendBtn) sendBtn.disabled = false;
                msgInput.disabled = false;
                if (typeof openPremiumModal === 'function') openPremiumModal();
                return;
            }
            advanceMessageCounter++;
            localStorage.setItem('advance_msg_counter', advanceMessageCounter.toString());
        } else if (currentTier === 'pro') {
            if (proMessageCounter >= MAX_PRO_MESSAGES) {
                alert("Our limit is expired, please subscribe this Brain! 🧠💎");
                msgInput.value = "";
                if (sendBtn) sendBtn.disabled = false;
                msgInput.disabled = false;
                if (typeof openPremiumModal === 'function') openPremiumModal();
                return;
            }
            proMessageCounter++;
            localStorage.setItem('pro_msg_counter', proMessageCounter.toString());
        }
    }

    // Session logic
    let session = chatSessions.find(s => s.id === currentSessionId);
    if (!session) {
        createNewChat();
        session = chatSessions[0];
    }

    // 20-MESSAGE PER CONVERSATION LIMIT GATEKEEPER
    const userMessagesInSession = session.messages.filter(msg => msg.sender === 'user').length;
    if (userMessagesInSession >= 20) {
        alert("🔒 This conversation has reached its 20-message limit. Please click '+ New Chat' to start a fresh conversion!");
        msgInput.value = "";
        if (sendBtn) sendBtn.disabled = false;
        msgInput.disabled = false;
        updateEngineState('active');
        return; 
    }

    // User message UI me push karein
    if (userMessageText) {
        session.messages.push({ sender: 'user', text: userMessageText });
    } else {
        session.messages.push({ sender: 'user', text: `📁 Attached File: ${attachedDocName}` });
    }
    
    msgInput.value = ''; // Input box clear kiya

    // Sidebar title update
    if (session.messages.length === 2 && userMessageText) {
        session.title = userMessageText.length > 25 ? userMessageText.slice(0, 25) + "..." : userMessageText;
        if (typeof renderSidebar === 'function') renderSidebar();
    }

    renderMessages();
    await syncWithDB();

    // AI thinking state create karein
    const loadingIndex = session.messages.push({ sender: 'ai', text: "Thinking..." }) - 1;
    renderMessages();
    if (typeof updateEngineState === 'function') updateEngineState('thinking');

    // Final Prompt taiyar karna backend ke liye
    let finalPromptToSend = userMessageText || "Please analyze this attached document.";

    if (attachedDocText && attachedDocText.trim() !== "") {
        finalPromptToSend = `[Attached Document: ${attachedDocName}]\nContext from document:\n"""\n${attachedDocText}\n"""\n\nUser Question: ${finalPromptToSend}`;
    }

    try {
        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tier: currentTier,
                messages: [
                    ...session.messages.slice(0, -1).map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'assistant', 
                        content: msg.text
                    })),
                    { role: "user", content: finalPromptToSend }
                ]
            })
        });

        // Variables aur UI badges ko reset karein
        attachedDocText = "";
        attachedDocName = "";
        const docNameEl = document.getElementById('doc-name-text');
        if (docNameEl) docNameEl.innerText = "";
        const badgeEl = document.getElementById('doc-preview-badge');
        if (badgeEl) badgeEl.style.display = 'none';

        const data = await response.json();

        // AI ka reply screen par dikhayein
        session.messages[loadingIndex].text = data.reply || "No response from AI.";
        renderMessages();

        if (typeof isVoiceMode !== 'undefined' && isVoiceMode) {
            speakAIResponse(data.reply);
        } else {
            if (typeof updateEngineState === 'function') updateEngineState('active');
        }

        await syncWithDB();

    } catch (error) {
        session.messages[loadingIndex].text = "⚠️ Server connection failed.";
        console.error("AI Fetch Error:", error);
        if (typeof updateEngineState === 'function') updateEngineState('active');
    } finally {
        // UI elements ko wapas unlock karein
        if (sendBtn) sendBtn.disabled = false;
        msgInput.disabled = false;
        msgInput.focus();
        renderMessages();
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
    const sidebarContainer = document.getElementById('session-list'); // Jo bhi aapka container ID hai
    sidebarContainer.innerHTML = "";

    // 🔥 FIX: Master list se sirf current tier ki chats filter karo
    const filteredChats = allChatSessions.filter(session => session.tier === currentTier);

    filteredChats.forEach(session => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${session.id === currentSessionId ? 'active' : ''}`;
        chatItem.innerText = session.title || "New Conversation";

        chatItem.onclick = () => {
            currentSessionId = session.id;
            renderMessages();
            renderSidebar();
        };

        sidebarContainer.appendChild(chatItem);
    });

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
                } catch (e) {
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

    utterance.onend = function () {
        const voiceToggleBtn = document.getElementById('voice-toggle-btn');
        if (isVoiceMode && recognition) {
            if (voiceToggleBtn) voiceToggleBtn.innerHTML = '🔴';
            updateEngineState('listening');
            try {
                recognition.start();
            } catch (e) {
                console.log("Error restarting recognition:", e);
            }
        } else {
            // 🔥 Agar voice mode band ho chuka hai toh wapas normal Active state
            updateEngineState('active');
        }
    };

    window.speechSynthesis.speak(utterance);
}

// 1. Enter key handle karne wala function
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

    switch (state) {
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

// ==========================================
// 🔄 NEW CHAT BUTTON CLICK LISTENER
// ==========================================

// 1. Pehle check karein ki button ki sahi ID kya hai (HTML ke hisab se)
const newChatBtn = document.getElementById('new-chat-btn') || document.getElementById('newChatBtn');

if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        // A. Naya session banayein aur currentSessionId update karein
        if (typeof createNewChat === 'function') {
            createNewChat();
        } else {
            console.error("❌ createNewChat function are not defined! Please check your code.");
        }

        // B. Input box aur Send Button ko wapas unlocked (enable) karein
        const msgInput = document.getElementById('msg-input');
        const sendBtn = document.getElementById('send-btn') || document.getElementById('sendBtn');

        if (msgInput) {
            msgInput.disabled = false;
            msgInput.value = ''; // Input box khali karein
            msgInput.focus();    // Cursor automatically input box me le aayein
        }
        if (sendBtn) {
            sendBtn.disabled = false;
        }

        // C. Engine state aur messages screen display ko refresh karein
        if (typeof updateEngineState === 'function') updateEngineState('active');
        if (typeof renderMessages === 'function') renderMessages();

        console.log("🔄 New chat started! Message limit successfully reseted");
    });
} else {
    console.warn("⚠️ Warning: in  HTML not have the ID plese check the ID of new chat button and update the code accordingly.");
}

// ==========================================
// 💳 PAYPAL PAYMENT FUNCTIONS
// ==========================================

let selectedPlanForPayment = null;
let userEmail = localStorage.getItem('userEmail') || '';

function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedPlanForPayment = null;
}

function selectPlan(plan) {
    selectedPlanForPayment = plan;
    console.log(`Selected plan: ${plan}`);
    initiatePayment(plan);
}

async function initiatePayment(plan) {
    if (!userEmail) {
        alert("Please login first!");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/create-payment-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, plan: plan })
        });

        const data = await response.json();
        if (data.success && data.approvalUrl) {
            window.location.href = data.approvalUrl;
        } else {
            alert('Payment initiation failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Error creating payment order');
    }
}

async function checkSubscriptionStatus() {
    if (!userEmail) return;

    try {
        const response = await fetch('http://localhost:3000/subscription-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });

        const data = await response.json();
        if (data.success) {
            updateUIWithSubscription(data);
            
            // Check if payment was successful via URL params
            const params = new URLSearchParams(window.location.search);
            if (params.get('payment_success') === 'true') {
                alert('✅ Payment successful! Your subscription is now active.');
                window.history.replaceState({}, document.title, window.location.pathname);
                location.reload();
            }
        }
    } catch (error) {
        console.error('Error checking subscription:', error);
    }
}

function updateUIWithSubscription(data) {
    const versionTitle = document.getElementById('current-version-title');
    if (versionTitle) {
        if (data.subscription === 'advance') {
            versionTitle.textContent = '⚡ Mind-pro Advance';
            versionTitle.style.color = '#3b82f6';
        } else if (data.subscription === 'pro') {
            versionTitle.textContent = '👑 Mind-pro Pro';
            versionTitle.style.color = '#a855f7';
        } else {
            versionTitle.textContent = '🍃 Mind-pro Basic';
            versionTitle.style.color = '#4ade80';
        }
    }

    // Show chat limit info
    if (data.chatLimit > 0) {
        const chatInfo = `${data.chatCountThisMonth}/${data.chatLimit} chats used`;
        console.log(chatInfo);
    }
}

// Check subscription on page load
window.addEventListener('load', () => {
    userEmail = localStorage.getItem('userEmail') || '';
    if (userEmail) {
        checkSubscriptionStatus();
    }
});
