
const uploadBtn = document.getElementById('doc-upload-btn');
const fileInput = document.getElementById('doc-file-input');

const otpPage = document.getElementById('otp-page');
const loginPage = document.getElementById('login-page');
const chatPage = document.getElementById('chat-page');

const msgInput = document.getElementById('msg-input');
const messageArea = document.getElementById('message-area');
const sessionList = document.getElementById('session-list');

let isVoiceMode = false;
let recognition = null;

let currentSessionId = null;
let allChatSessions = [];
let chatSessions = [];

let allMessagesArray = [];
let attachedDocText = "";
let attachedDocName = "";
let currentTier = localStorage.getItem('selectedTier') || 'basic';
let currentAgentType = localStorage.getItem('selectedAgentType') || 'student';

if (uploadBtn) {
    uploadBtn.addEventListener('click', (e) => {
        if (typeof currentTier !== 'undefined' && currentTier === 'basic') {
            e.preventDefault();
            alert("🔒 Document upload is an Advance & Pro feature! Please switch to Advance or Pro Tier to analyze files.");
            return;
        }

        console.log("🔄 Opening file dialog...");

    });
} else {

    console.log("ℹ️ 'doc-upload-btn' element is page par nahi mila.");
}

// =============================================
// CHECKUPLOADBUTTONVISIBILITY FUNCTION (Premium Tiers ke liye Upload Button Show/Hide karega)
// =============================================

function checkUploadButtonVisibility(tier) {
    const btnToHideShow = document.getElementById('doc-upload-btn');

    if (btnToHideShow) {
        if (tier === 'advance' || tier === 'pro') {
            btnToHideShow.style.display = 'inline-flex';
            console.log("🟢 Premium Tier Detected: Upload Button Shown!");
        } else {
            btnToHideShow.style.display = 'none';
            console.log("🔴 Basic Tier Detected: Upload Button Hidden!");
        }
    }
}

// ==================================================
// DOCFILE INPUT CHANGE EVENT (File select karne par document ko memory me load karega)
// ==================================================

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

// ====================================================
// CHATPANEL TO CHOICE A TIER WISE 
// ====================================================

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

        if (!localStorage.getItem('mindpro_messages_basic') && chatDisplay.innerHTML.trim() !== '') {
            const initialBasicStructure = chatDisplay.innerHTML;
            chatPanels.basic = initialBasicStructure;
            chatPanels.advance = initialBasicStructure;
            chatPanels.pro = initialBasicStructure;

            localStorage.setItem('mindpro_messages_basic', initialBasicStructure);
            localStorage.setItem('mindpro_messages_advance', initialBasicStructure);
            localStorage.setItem('mindpro_messages_pro', initialBasicStructure);
        } else {

            chatDisplay.innerHTML = chatPanels[currentTier];
        }
    }
});
const chatDisplay = document.getElementById('message-area');

// ===========================================================
// SELECT VERSION FUNCTION (User jab tier select karega to uske hisab se chat panel load karega aur upload button show/hide karega)
// ===========================================================

function selectVersion(tier) {

    if ((tier === 'advance' || tier === 'pro') && currentTier === 'basic') {

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
// CHAT HISTORY (Fixes Login/Logout Persistence)
// ==========================================

function toggleVersionMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('version-menu');

    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}


window.addEventListener('click', function (event) {
    const menu = document.getElementById('version-menu');
    const toggleBtn = document.getElementById('menu-toggle');

    if (menu && menu.style.display === 'block' && !menu.contains(event.target) && event.target !== toggleBtn) {
        menu.style.display = 'none';
    }
});

// ======================================================
// LOADSTOREDCHATS FUNCTION (User ke email ke hisab se server se chat history load karega, aur agar tier wise history mile to uske hisab se chats filter karega)
// ======================================================

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

            chatSessions = [];

            setupChatsForCurrentTier();
        }

    } catch (error) {
        console.error("Frontend loading error:", error);
    }
}

// ======================================================
// SETUPCHATSFORCURRENTTIER FUNCTION (Current tier ke hisab se chats ko filter karega aur agar history mile to uske hisab se sidebar aur messages render karega, warna fresh chat start karega)
// ======================================================

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

// =====================================================================
// SYNCWITHDB FUNCTION (User ke email ke hisab se server par chat history sync karega, aur agar tier wise history mile to uske hisab se chats ko update karega, warna new entry create karega)
// =====================================================================

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

// =========================================================================
// WINDOW PANNELE ONLOAD (User jab page load karega to check karega ki localStorage me email saved hai ya nahi, agar saved hai to uske hisab se UI update karega aur server se chat history load karega)
// =========================================================================

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

// ================================================================
// VERIFYOTP FUNCTION (User jab OTP submit karega to server se verify karega, agar valid hua to localStorage me email save karega, UI update karega, success popup show karega, aur server se chat history load karega)
// ================================================================

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
            headers: {'Content-Type': 'application/json' },
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

    const avatarEle = document.getElementById('user-avatar');
    if (avatarEle && email) {
        avatarEle.innerText = email.charAt(0).toUpperCase();
    }

    document.getElementById('login-page').style.display = 'none';
    document.getElementById('chat-page').style.display = 'flex';

    if (typeof loadStoredChats === "function") {
        await loadStoredChats(email);
    }
}

// =====================================================
// SAVETODATABASE FUNCTION (User ke email ke hisab se server par chat history save karega, aur agar tier wise history mile to uske hisab se chats ko update karega, warna new entry create karega)
// =====================================================

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
            headers: {'Content-Type': 'application/json' },
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

// =================================================
// SENDOTP FUNCTION (User jab OTP ke liye request karega to server se OTP send karne ko bolega, aur agar email valid nahi hai to alert karega)
// =================================================

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
            headers: {'Content-Type': 'application/json' },
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

// =======================================================
// LOGOUT FUNCTION (User jab logout karega to localStorage clear karega aur page reload karega jisse login page wapas aa jayega)
// =======================================================

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
// CHAT LOGIC WITH AUTO-SAVE
// ==========================================

function createNewChat() {
    console.log("Starting fresh new chat...");
    const searchInput = document.getElementById('chat-word-search');
    if (searchInput) searchInput.value = "";

    const newSessionId = 'session_' + Date.now();

    const session = {
        id: newSessionId,
        title: "New Conversation",
        tier: typeof currentTier !== 'undefined' ? currentTier : 'advance',
        messages: [{ sender: 'ai', text: "Hello! I am Mind-pro AI. How can I help you?" }]
    };

    if (typeof chatSessions !== 'undefined' && Array.isArray(chatSessions)) {
        chatSessions.unshift(session);
    } else {
        chatSessions = [session];
    }

    if (typeof allChatSessions !== 'undefined' && Array.isArray(allChatSessions)) {
        allChatSessions.unshift(session);
    }
    currentSessionId = newSessionId;
    if (typeof renderSidebar === 'function') renderSidebar();
    if (typeof renderMessages === 'function') renderMessages();
    if (typeof syncWithDB === 'function') syncWithDB();

    console.log("🚀 Fresh session successfully created with ID:", currentSessionId);
}

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
            askAI();
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

// ==========================================
// 24-HOUR LIMIT RESET MANAGER
// ==========================================
function checkAndResetDailyLimits() {
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 Ghante Milliseconds me

    // --- Advance Tier Reset Check ---
    const advanceResetTime = localStorage.getItem('advance_limit_reset_time');
    if (!advanceResetTime) {
        // Agar pehli baar chal raha hai toh agle 24 ghante ke liye time set karein
        localStorage.setItem('advance_limit_reset_time', (now + ONE_DAY_MS).toString());
    } else if (now >= parseInt(advanceResetTime)) {
        // 24 ghante poore ho gaye! Reset limit and set new timer
        advanceMessageCounter = 0;
        localStorage.setItem('advance_msg_counter', '0');
        localStorage.setItem('advance_limit_reset_time', (now + ONE_DAY_MS).toString());
        console.log("🔄 Advance Tier message limit auto-reseted for next 24 hours!");
    }

    // --- Pro Tier Reset Check ---
    const proResetTime = localStorage.getItem('pro_limit_reset_time');
    if (!proResetTime) {
        localStorage.setItem('pro_limit_reset_time', (now + ONE_DAY_MS).toString());
    } else if (now >= parseInt(proResetTime)) {
        proMessageCounter = 0;
        localStorage.setItem('pro_msg_counter', '0');
        localStorage.setItem('pro_limit_reset_time', (now + ONE_DAY_MS).toString());
        console.log("🔄 Pro Tier message limit auto-reseted for next 24 hours!");
    }
}

// Page load hote hi limits check karein
window.addEventListener('DOMContentLoaded', () => {
    checkAndResetDailyLimits();
});

// ==========================================================
// ASKAI FUNCTION (User jab message bhejega to ye function call hoga, jo ki message ko current session me add karega, UI update karega, server se AI response fetch karega, aur phir response ko UI me show karega. Saath hi saath ye function message limits aur tier restrictions bhi handle karega)
// ===========================================================

async function askAI() {
    // 🎯 ID AUTO-DETECT: Dash wala ho ya bina dash wala, dono kaam karenge!
    const msgInput = document.getElementById('msgInput') || document.getElementById('msg-input');
    const sendBtn = document.getElementById('sendBtn') || document.getElementById('send-btn');

    if (!msgInput) {
        console.error("❌ Error: Na 'msgInput' mila na 'msg-input'. Apne HTML me text input ki ID check karein!");
        return;
    }
    const userMessageText = msgInput.value.trim();
    if (!userMessageText && (!attachedDocText || attachedDocText.trim() === "")) {
        return;
    }

    if (sendBtn) sendBtn.disabled = true;
    msgInput.disabled = true;

    // 🕒 MESSAGE BHEJNE SE PEHLE 24-HOUR LIMIT CHECK KAREIN
    checkAndResetDailyLimits();

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

    let session = chatSessions.find(s => s.id === currentSessionId);
    if (!session) {
        createNewChat();
        session = chatSessions[0];
    }

    const userMessagesInSession = session.messages.filter(msg => msg.sender === 'user').length;
    if (userMessagesInSession >= 20) {
        alert("🔒 This conversation has reached its 20-message limit. Please click '+ New Chat' to start a fresh conversion!");
        msgInput.value = "";
        if (sendBtn) sendBtn.disabled = false;
        msgInput.disabled = false;
        updateEngineState('active');
        return;
    }

    if (userMessageText) {
        session.messages.push({ sender: 'user', text: userMessageText });
    } else {
        session.messages.push({ sender: 'user', text: `📁 Attached File: ${attachedDocName}` });
    }

    msgInput.value = '';

    if (session.messages.length === 2 && userMessageText) {
        session.title = userMessageText.length > 25 ? userMessageText.slice(0, 25) + "..." : userMessageText;
        if (typeof renderSidebar === 'function') renderSidebar();
    }

    renderMessages();
    await syncWithDB();

    const loadingIndex = session.messages.push({ sender: 'ai', text: "Thinking..." }) - 1;
    renderMessages();
    if (typeof updateEngineState === 'function') updateEngineState('thinking');

    let finalPromptToSend = userMessageText || "Please analyze this attached document.";

    if (attachedDocText && attachedDocText.trim() !== "") {
        finalPromptToSend = `[Attached Document: ${attachedDocName}]\nContext from document:\n"""\n${attachedDocText}\n"""\n\nUser Question: ${finalPromptToSend}`;
    }

    try {
        const response = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json' },
            body: JSON.stringify({
                tier: currentTier,
                agentType: currentAgentType,
                messages: [
                    ...session.messages.slice(0, -1).map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    })),
                    { role: "user", content: finalPromptToSend }
                ]
            })
        });

        attachedDocText = "";
        attachedDocName = "";
        const docNameEl = document.getElementById('doc-name-text');
        if (docNameEl) docNameEl.innerText = "";
        const badgeEl = document.getElementById('doc-preview-badge');
        if (badgeEl) badgeEl.style.display = 'none';

        const data = await response.json();
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
//  UI RENDER FUNCTIONS (Double Entry BUG FIXED 🚀)
// ==========================================

function renderSidebar() {
    const sessionList = document.getElementById('session-list');
    if (!sessionList) return;

    if (!Array.isArray(chatSessions)) {
        chatSessions = [];
    }

    sessionList.innerHTML = "";

    let filteredChats = chatSessions.filter(session => session.tier === currentTier);

    filteredChats.sort((a, b) => (b.pinned || false) - (a.pinned || false));

    filteredChats.forEach(session => {
        const div = document.createElement('div');
        div.className = `chat-item ${session.id === currentSessionId ? 'active' : ''}`;

        const titleText = document.createElement('span');
        titleText.className = 'chat-title';
        titleText.innerText = (session.pinned ? '📍 ' : '') + (session.title || "New Conversation");

        titleText.onclick = () => {
            currentSessionId = session.id;
            renderSidebar();
            if (typeof renderMessages === 'function') renderMessages();
        };

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'chat-actions';

        const pinBtn = document.createElement('button');
        pinBtn.innerHTML = session.pinned ? '🏷️' : '📌';
        pinBtn.onclick = (e) => {
            e.stopPropagation();
            session.pinned = !session.pinned;
            renderSidebar();
            if (typeof syncWithDB === 'function') syncWithDB();
        };

        const delBtn = document.createElement('button');
        delBtn.innerHTML = '🗑️';
        delBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this chat?")) {
                chatSessions = chatSessions.filter(s => String(s.id) !== String(session.id));
                if (typeof allChatSessions !== 'undefined' && Array.isArray(allChatSessions)) {
                    allChatSessions = allChatSessions.filter(s => String(s.id) !== String(session.id));
                }

                if (String(currentSessionId) === String(session.id)) {
                    currentSessionId = chatSessions.length > 0 ? chatSessions[0].id : null;
                }

                renderSidebar();
                if (typeof renderMessages === 'function') renderMessages();

                // Backup update on server
                if (typeof syncWithDB === 'function') syncWithDB();
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
//  EVENT LISTENERS & UI HELPERS
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

            updateEngineState('active');
        }
    };

    window.speechSynthesis.speak(utterance);
}

function handleSearchEnter(event) {
    if (event && event.key === 'Enter') {
        event.preventDefault();
        console.log("Enter hit! Strict filtering starting...");

        searchChatMessages(event);
        document.getElementById('chat-word-search').blur();
    }
}

function searchChatMessages(event) {
    // Search box se value uthayein
    const searchQuery = document.getElementById('chat-word-search').value.toLowerCase().trim();

    const chatWindow = document.querySelector('.chat-window');
    if (!chatWindow) {
        console.error("Oops! .chat-window elements nahi mila.");
        return;
    }

    const allMessages = chatWindow.querySelectorAll('.message, .chat-box, [class*="message"]');

    if (searchQuery === "") {
        allMessages.forEach(msgDiv => {
            msgDiv.style.display = "";
        });
        return;
    }

    let firstMatchedMessage = null;

    // Strict Filtering Loop
    allMessages.forEach(msgDiv => {
        const messageText = msgDiv.textContent.toLowerCase();

        if (messageText.includes(searchQuery)) {
            msgDiv.style.display = "";

            if (!firstMatchedMessage) {
                firstMatchedMessage = msgDiv;
            }
        } else {
            msgDiv.style.display = "none";
        }
    });

    if (event && event.key === 'Enter' && firstMatchedMessage) {
        firstMatchedMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
// ==============================================
// UPDATEUSERUI FUNCTION (User ke email ke hisab se avatar aur popup email update karega)
// ==============================================

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

// =====================================================
// UPDATEENGINESTATE FUNCTION (Engine ke current state ke hisab se UI update karega, jaise ki text aur dot color change karna)
// =====================================================

function updateEngineState(state) {
    const engineText = document.getElementById('engine-text');
    const engineDot = document.getElementById('engine-dot');

    if (!engineText || !engineDot) return;

    engineDot.className = "status-dot";

    switch (state) {
        case 'listening':
            engineText.innerText = "Engine: Listening...";
            engineText.style.color = "#eab308";
            engineDot.classList.add('listening-dot');
            break;

        case 'thinking':
            engineText.innerText = "Engine: Thinking...";
            engineText.style.color = "#3b82f6";
            engineDot.classList.add('thinking-dot');
            break;

        case 'speaking':
            engineText.innerText = "Engine: Speaking...";
            engineText.style.color = "#a855f7";
            engineDot.classList.add('speaking-dot');
            break;

        case 'active':
        default:
            engineText.innerText = "Engine: Active";
            engineText.style.color = "#4ade80";
            engineDot.classList.add('active-dot');
            break;
    }
}

// ==========================================
//  NEW CHAT BUTTON CLICK LISTENER
// ==========================================

const newChatBtn = document.getElementById('new-chat-btn') || document.getElementById('newChatBtn');

if (newChatBtn) {
    newChatBtn.addEventListener('click', createNewChat);
}

// ==========================================
// AI AGENT PACK SELECTOR EVENT LISTENER
// ==========================================

const agentSelector = document.getElementById('agent-selector');
const agentIcon = document.getElementById('agent-icon');

if (agentSelector) {
    agentSelector.addEventListener('change', function(e) {
        currentAgentType = e.target.value;
        localStorage.setItem('selectedAgentType', currentAgentType);
        
        // Update agent icon based on selection
        const agentIcons = {
            'student': '📚',
            'business': '💼',
            'local': '📍'
        };
        
        if (agentIcon) {
            agentIcon.textContent = agentIcons[currentAgentType] || '📚';
        }
        
        console.log(`✅ AI Agent Pack changed to: ${currentAgentType}`);
    });
    
    // Set initial icon
    const initialAgentType = localStorage.getItem('selectedAgentType') || 'student';
    agentSelector.value = initialAgentType;
    const agentIcons = {
        'student': '📚',
        'business': '💼',
        'local': '📍'
    };
    if (agentIcon) {
        agentIcon.textContent = agentIcons[initialAgentType] || '📚';
    }
}
    newChatBtn.addEventListener('click', () => {

        const msgInput = document.getElementById('msg-input');
        const sendBtn = document.getElementById('send-btn') || document.getElementById('sendBtn');

        if (msgInput) {
            msgInput.disabled = false;
            msgInput.value = '';
            msgInput.focus();
        }
        if (sendBtn) {
            sendBtn.disabled = false;
        }

        if (typeof updateEngineState === 'function') updateEngineState('active');
        if (typeof renderMessages === 'function') renderMessages();

        console.log("🔄 New chat started! Message limit successfully reseted");
    });
    
// ==========================================
//  PAYPAL PAYMENT FUNCTIONS
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
            headers: {'Content-Type': 'application/json' },
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


    if (data.chatLimit > 0) {
        const chatInfo = `${data.chatCountThisMonth}/${data.chatLimit} chats used`;
        console.log(chatInfo);
    }
}

window.addEventListener('load', () => {
    userEmail = localStorage.getItem('userEmail') || '';
    if (userEmail) {
        checkSubscriptionStatus();
    }
});

// ==========================================
//  QR CODE PAYMENT FUNCTIONS
// ==========================================

let selectedPlanForQR = null;
let currentQRData = null;

function openQRPaymentModal() {
    const modal = document.getElementById('qr-payment-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeQRPaymentModal() {
    const modal = document.getElementById('qr-payment-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    backToPlans();
}

function backToPlans() {
    document.getElementById('qr-plan-selection').style.display = 'flex';
    document.getElementById('qr-code-section').style.display = 'none';
    document.getElementById('back-to-plans-btn').style.display = 'none';
    selectedPlanForQR = null;
    currentQRData = null;
}

async function generateQRCode(plan) {
    if (!userEmail) {
        alert('Please login first!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/generate-qr-code', {
            method: 'POST',
            headers: {'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, plan: plan })
        });

        const data = await response.json();

        if (data.success) {
            selectedPlanForQR = plan;
            currentQRData = data;

            // Update QR code display
            document.getElementById('qr-code-image').src = data.qrCode;
            document.getElementById('qr-plan-name').textContent = data.description;
            document.getElementById('qr-amount').textContent = data.amount;
            document.getElementById('qr-description').textContent = data.description;

            // Hide plan selection, show QR code
            document.getElementById('qr-plan-selection').style.display = 'none';
            document.getElementById('qr-code-section').style.display = 'block';
            document.getElementById('back-to-plans-btn').style.display = 'block';

            console.log('✅ QR Code Generated:', data);
        } else {
            alert('Failed to generate QR code: ' + data.message);
        }
    } catch (error) {
        console.error('QR Code error:', error);
        alert('Error generating QR code');
    }
}

// ===============================
// COPY PAYMENT LINK
// ===============================

function copyPaymentLink() {
    if (currentQRData && currentQRData.paymentUrl) {
        navigator.clipboard.writeText(currentQRData.paymentUrl).then(() => {
            alert('✅ Payment link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy link');
        });
    }
}

function openPaymentApp() {
    if (currentQRData && currentQRData.paymentUrl) {
        window.open(currentQRData.paymentUrl, '_blank');
    }
}

function updateSelectVersionForQR() {
    const originalSelectVersion = window.selectVersion;
    window.selectVersion = function (tier) {
        if ((tier === 'advance' || tier === 'pro') && currentTier === 'basic') {
            const userSub = localStorage.getItem('userSubscription') || 'free';
            if (userSub === 'free') {
                openQRPaymentModal();
                return;
            }
        }
        originalSelectVersion.call(this, tier);
    };
}
// Call on page load
updateSelectVersionForQR();

