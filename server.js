// ====================================
// ====================================
// START OF server.js (WITH 24H LIMIT RECOVERY)
// ====================================
// ====================================
require('dotenv').config();
 
console.log("TESTING ENV USER:", process.env.EMAIL_USER);
console.log("TESTING ENV PASS:", process.env.EMAIL_PASS ? "Password Loaded" : "Password Missing");

let users = [];

const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const nodemailer = require('nodemailer');
const paypal = require('paypal-rest-sdk');
const QRCode = require('qrcode');

// ==========================================
// AI AGENT PACKS INTEGRATION
// ==========================================
const { getAgentConfig, getSystemPrompt, getAllAgents } = require('./agents/agentConfig');
const StudentAgent = require('./agents/studentAgent');
const BusinessAgent = require('./agents/businessAgent');
const LocalAgent = require('./agents/localAgent');
const apiIntegrations = require('./tools/apiIntegrations');

// Initialize agents
const agents = {
    student: new StudentAgent(process.env.OPENROUTER_API_KEY),
    business: new BusinessAgent(process.env.OPENROUTER_API_KEY),
    local: new LocalAgent(process.env.OPENROUTER_API_KEY)
};

app.use(express.static(__dirname));
app.use(express.json());
app.use(cors());
app.listen(PORT, () => console.log(`🚀 Server is running smoothly on port ${PORT}`));

// ==============================
// PAYPAL CONFIGURATION
// ==============================

paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});

console.log("🔍 DEBUG - Raw MONGO_URI:", process.env.MONGO_URI);

let dbURI = process.env.MONGO_URI ? String(process.env.MONGO_URI) : "";
dbURI = dbURI.replace(/['"]/g, '').trim();

console.log("🛠️ DEBUG - Cleaned URI:", dbURI.substring(0, 20) + "...");

if (!dbURI.startsWith("mongodb")) {
    console.log("❌ ERROR: check please URI.");
} else {
    mongoose.connect(dbURI, { family: 4 })
        .then(() => console.log("☁️ ✅ MongoDB Cloud Connected Successfully!"))
        .catch(err => console.log("❌ MongoDB Connection Error:", err.message));
}

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==============================================
// USER AND PAYMENT SCHEMAS
// ==============================================

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date, default: Date.now },
    chats: { type: Array, default: [] },
    subscription: { type: String, enum: ['free', 'advance', 'pro'], default: 'free' },
    subscriptionExpiry: { type: Date, default: null },
    chatCountThisMonth: { type: Number, default: 0 },
    monthResetDate: { type: Date, default: Date.now },
    limitReachedAt: { type: Date, default: null } // 🌟 Naya Field: 24h Recovery Track karne ke liye
});

const User = mongoose.model('User', UserSchema);

const PaymentSchema = new mongoose.Schema({
    email: { type: String, required: true },
    orderId: { type: String, unique: true },
    plan: { type: String, enum: ['advance', 'pro'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentId: { type: String },
    paymentDate: { type: Date, default: Date.now },
    expiryDate: { type: Date }
});

const Payment = mongoose.model('Payment', PaymentSchema);

// ============================================
// API ENDPOINTS
// ============================================

// ==========================================
// AI AGENT MANAGEMENT ENDPOINTS
// ==========================================

/**
 * Get all available AI agents
 */
app.get('/agents', (req, res) => {
    try {
        const allAgents = getAllAgents();
        const agentList = Object.entries(allAgents).map(([key, config]) => ({
            type: key,
            name: config.name,
            icon: config.icon,
            color: config.color,
            description: config.description,
            capabilities: config.capabilities
        }));
        
        res.json({
            success: true,
            agents: agentList
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Get specific agent details
 */
app.get('/agents/:agentType', (req, res) => {
    try {
        const { agentType } = req.params;
        const config = getAgentConfig(agentType);
        
        if (!config) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }
        
        res.json({
            success: true,
            agent: {
                type: agentType,
                name: config.name,
                icon: config.icon,
                color: config.color,
                description: config.description,
                capabilities: config.capabilities,
                systemPrompt: config.systemPrompt
            }
        });
    } catch (error) {
        console.error('Error fetching agent details:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});


const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
let otpStore = {};
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525, 
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify((error, success) => {
    if (error) {
        console.log("⚠️ SMTP Warning (Check credentials or internet):", error.message);
    } else {
        console.log("✅ Mail Server is locked and ready!");
    }
});

// ============================================
// SEND OTP
// ============================================

app.post('/send-otp', async (req, res) => {
    let { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }
    email = email.trim().toLowerCase();

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code: ' + otp,
        text: `Your OTP is: ${otp}`,
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2>Verification Code</h2>
            <p>Your OTP for logging in is: <strong style="font-size: 24px; color: #4A90E2;">${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
        </div>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP sent to ${email}: ${otp}`);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Email Error:", error);
        res.status(500).json({ success: false, message: "Email sending failed" });
    }
});

// ==============================================
// VERIFY OTP AND LOGIN/SIGNUP
// ==============================================   

app.post('/verify-otp', async (req, res) => {
    try {
        const inputEmail = req.body.email ? req.body.email.toLowerCase().trim() : "";
        const inputOtp = req.body.otp ? String(req.body.otp).trim() : "";

        if (otpStore[inputEmail] && String(otpStore[inputEmail]) === inputOtp) {
            delete otpStore[inputEmail];

            let user = await User.findOne({ email: inputEmail });
            let isNew = false;

            if (!user) {
                isNew = true;
                user = new User({
                    email: inputEmail,
                    isVerified: true,
                    chats: []
                });
                await user.save();
                console.log(`🆕 New User Signup: ${inputEmail}`);
            } else {
                user.isVerified = true;
                user.lastLogin = Date.now();
                await user.save();

                isNew = !(user.chats && user.chats.length > 0);
                console.log(`🏠 Existing User Login: ${inputEmail}`);
            }

            return res.json({
                success: true,
                email: user.email,
                isNewUser: isNew,
                chats: user.chats
            });

        } else {
            return res.status(401).json({ success: false, message: "Invalid OTP" });
        }
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// ===================================================
// SAVECHATS, DELETECHATS, GETCHATS ENDPOINTS
// ===================================================

app.post('/save-chats', async (req, res) => {
    const { email, chats } = req.body;

    console.log("Received save request for:", email);
    console.log("Chat count:", chats ? chats.length : 0);
    try {
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is missing" });
        }
        const result = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { $set: { chats: chats } },
            { upsert: true, returnDocument: 'after' }
        );
        if (result) {
            res.json({ success: true, message: "Data saved in users collection" });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/delete-chats', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is missing" });
    }

    try {
        await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { $set: { chats: [] } }
        );
        res.json({ success: true, message: "All chats deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/get-chats', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email });

        if (user) {
            res.json({
                success: true,
                chats: user.chats || [],
                subscription: user.subscription,
                chatCountThisMonth: user.chatCountThisMonth
            });
        } else {
            res.json({
                success: true,
                chats: [],
                subscription: 'free',
                chatCountThisMonth: 0
            });
        }

    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===================================================
// CREATE PAYMENT ORDER AND EXECUTE PAYMENT ENDPOINTS
// ===================================================

app.post('/create-payment-order', async (req, res) => {
    const { email, plan } = req.body;

    if (!email || !plan) {
        return res.status(400).json({ success: false, message: "Email and plan required" });
    }

    const planDetails = {
        advance: { price: 150, description: 'Advance Plan - 200 chats/month' },
        pro: { price: 300, description: 'Pro Plan - 100 chats/month' }
    };

    if (!planDetails[plan]) {
        return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    const create_payment_json = {
        intent: "sale",
        payer: {
            payment_method: "paypal"
        },
        redirect_urls: {
            return_url: `http://localhost:3000?payment_success=true&email=${email}&plan=${plan}`,
            cancel_url: `http://localhost:3000?payment_cancelled=true`
        },
        transactions: [{
            item_list: {
                items: [{
                    name: planDetails[plan].description,
                    sku: plan,
                    price: String(planDetails[plan].price),
                    currency: "INR",
                    quantity: 1
                }]
            },
            amount: {
                currency: "INR",
                total: String(planDetails[plan].price)
            },
            description: planDetails[plan].description
        }]
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
        if (error) {
            console.error("PayPal Error:", error);
            return res.status(500).json({ success: false, message: "Payment creation failed", error: error.message });
        } else {
            const links = payment.links.find(link => link.rel === 'approval_url');
            res.json({
                success: true,
                paymentId: payment.id,
                approvalUrl: links ? links.href : null
            });
        }
    });
});


app.post('/execute-payment', async (req, res) => {
    const { paymentId, payerId, email, plan } = req.body;

    if (!paymentId || !payerId || !email || !plan) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    paypal.payment.execute(paymentId, { payer_id: payerId }, async (error, payment) => {
        if (error) {
            console.error("PayPal Execution Error:", error);
            return res.status(500).json({ success: false, message: "Payment execution failed" });
        } else {
            if (payment.state === 'approved') {
                const expiryDate = new Date();
                expiryDate.setMonth(expiryDate.getMonth() + 1);

                try {
                    const paymentRecord = new Payment({
                        email: email.toLowerCase().trim(),
                        orderId: payment.id,
                        plan: plan,
                        amount: parseFloat(payment.transactions[0].amount.total),
                        status: 'completed',
                        paymentId: payment.id,
                        expiryDate: expiryDate
                    });
                    await paymentRecord.save();

                    const user = await User.findOneAndUpdate(
                        { email: email.toLowerCase().trim() },
                        {
                            subscription: plan,
                            subscriptionExpiry: expiryDate,
                            chatCountThisMonth: 0,
                            monthResetDate: new Date(),
                            limitReachedAt: null // Reset limit tracking on new upgrade
                        },
                        { upsert: true, returnDocument: 'after' }
                    );

                    console.log(`✅ Payment Successful: ${email} upgraded to ${plan}`);
                    res.json({ success: true, message: "Payment successful", subscription: plan });
                } catch (dbError) {
                    console.error("Database Error:", dbError);
                    res.status(500).json({ success: false, message: "Payment recorded but database error occurred" });
                }
            } else {
                res.status(400).json({ success: false, message: "Payment not approved" });
            }
        }
    });
});

// ===================================================
// SUBSCRIPTION STATUS ENDPOINT (WITH AUTO-RESET CHECK)
// ===================================================

app.post('/subscription-status', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.json({ success: true, subscription: 'free', chatCountThisMonth: 0, chatLimit: -1 });
        }

        if (user.subscriptionExpiry && new Date() > user.subscriptionExpiry) {
            user.subscription = 'free';
            user.subscriptionExpiry = null;
            user.limitReachedAt = null;
            await user.save();
        }

        const chatLimits = { free: -1, advance: 200, pro: 100 };
        const limit = chatLimits[user.subscription] || -1;

        // 🌟 Page load par bhi check karega agar 24 ghante beet chuke hain toh limit clear kar dega
        if (limit > 0 && user.chatCountThisMonth >= limit && user.limitReachedAt) {
            const hoursPassed = (new Date() - new Date(user.limitReachedAt)) / (1000 * 60 * 60);
            if (hoursPassed >= 24) {
                user.chatCountThisMonth = 0;
                user.limitReachedAt = null;
                await user.save();
                console.log(`🔄 Limit auto-recovered on status check for: ${user.email}`);
            }
        }

        res.json({
            success: true,
            subscription: user.subscription,
            chatCountThisMonth: user.chatCountThisMonth,
            chatLimit: chatLimits[user.subscription],
            subscriptionExpiry: user.subscriptionExpiry
        });
    } catch (error) {
        console.error('Subscription status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================
// GENERATE QR CODE ENDPOINT
// ================================================================

app.post('/generate-qr-code', async (req, res) => {
    const { email, plan } = req.body;

    if (!email || !plan) {
        return res.status(400).json({ success: false, message: "Email and plan required" });
    }

    const planDetails = {
        advance: { price: 150, description: 'Advance Plan - 200 chats/month' },
        pro: { price: 300, description: 'Pro Plan - 100 chats/month' }
    };

    if (!planDetails[plan]) {
        return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    try {
        const paymentString = `https://upi.paypal.me/mindpro/${planDetails[plan].price}?txnId=MINDPRO${Date.now()}`;
        
        const qrCode = await QRCode.toDataURL(paymentString, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            width: 300,
        });

        res.json({
            success: true,
            qrCode: qrCode,
            plan: plan,
            amount: planDetails[plan].price,
            description: planDetails[plan].description,
            paymentUrl: paymentString
        });
    } catch (error) {
        console.error('QR Code Generation Error:', error);
        res.status(500).json({ success: false, message: "Failed to generate QR code", error: error.message });
    }
});

// =============================================
// CHAT ENDPOINT (WITH AGENT PACK SUPPORT & 24H AUTO LIMIT RECOVERY)
// =============================================

app.post('/chat', async (req, res) => {
    let { tier, model, messages, email, agentType } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ reply: "⚠️ Invalid data: Messages array is missing." });
    }

    // Set default agent if not specified
    agentType = agentType || 'student';

    if (email) {
        try {
            const user = await User.findOne({ email: email.toLowerCase().trim() });
            if (user) {
                const chatLimits = { free: -1, advance: 200, pro: 100 };
                const limit = chatLimits[user.subscription] || -1;

                // 🌟 [START] 24-HOUR AUTO LIMIT RECOVERY ENFORCEMENT
                if (limit > 0 && user.chatCountThisMonth >= limit) {
                    if (user.limitReachedAt) {
                        const hoursPassed = (new Date() - new Date(user.limitReachedAt)) / (1000 * 60 * 60);

                        if (hoursPassed >= 24) {
                            // 🎉 24 Ghante ho gaye! Limit ko recover (reset) karo
                            user.chatCountThisMonth = 0;
                            user.limitReachedAt = null;
                            await user.save();
                            console.log(`🔄 Limit successfully recovered for 24h cycle: ${user.email}`);
                        } else {
                            // 🚫 Abhi 24 ghante nahi hue, user ko tight lockout rakho
                            const timeLeft = Math.ceil(24 - hoursPassed);
                            return res.status(429).json({
                                reply: `⚠️ You have reached your limit of ${limit} chats. As an Advance/Pro user, your limit will automatically recover in ${timeLeft} hour(s). Please wait and continue chatting then!`
                            });
                        }
                    } else {
                        // Agar kisi wajah se timestamp missing tha par limit full thi, toh timestamp ab lagao aur block karo
                        user.limitReachedAt = new Date();
                        await user.save();
                        return res.status(429).json({
                            reply: `⚠️ You have reached your limit of ${limit} chats. Your 24-hour recovery cycle has started. Please try again later.`
                        });
                    }
                }
                // 🌟 [END] 24-HOUR AUTO LIMIT RECOVERY ENFORCEMENT

                // Chat count badhayein kyunki user valid hai ya limit ke andar hai
                user.chatCountThisMonth += 1;

                // 🔥 Agar is chat ke baad user ne limit hit kar di, toh time note kar lo!
                if (user.chatCountThisMonth >= limit && limit > 0) {
                    user.limitReachedAt = new Date();
                    console.log(`⚠️ Limit hit registered for ${user.email} at ${user.limitReachedAt}`);
                }

                await user.save();
                tier = user.subscription;
            }
        } catch (error) {
            console.error("Error checking chat limit:", error);
        }
    }

    let selectedModel = "openai/gpt-4o-mini";
    let tokenLimit = 1500;

    if (tier === 'advance') {
        selectedModel = "gemini-2.5-pro";
        tokenLimit = 2500;
    } else if (tier === 'pro') {
        selectedModel = "deepseek/deepseek-r1-distill-llama-70b";
        tokenLimit = 4000;
    } else if (model) {
        selectedModel = model;
    }

    console.log(`📡 Processing request... Tier: [${tier || 'basic'}] | Agent: ${agentType} | Model: ${selectedModel}`);

    // Get agent-specific system prompt
    let systemPromptContent = getSystemPrompt(agentType);
    
    const systemPrompt = {
        role: "system",
        content: systemPromptContent
    };

    const finalMessages = [systemPrompt, ...messages.flat()];

    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: selectedModel,
                messages: finalMessages,
                max_tokens: tokenLimit
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Mind-Pro AI Web App"
                }
            }
        );

        const aiReply = response.data.choices[0].message.content;
        res.json({ reply: aiReply, agentType: agentType });

    } catch (error) {
        console.error("❌ OpenRouter Error Detail:", error.response ? error.response.data : error.message);
        res.status(500).json({ reply: "⚠️ API Error: Server ya Model mein koi problem hai." });
    }
});

const cron = require('node-cron');
const { exec } = require('child_process');

cron.schedule('0 2 * * *', () => {
    console.log("⏰ Auto-Backup: Starting scheduled task...");
    exec('node backup.js', (error) => {
        if (error) console.error("❌ Auto-Backup Failed:", error);
        else console.log("✅ Auto-Backup Successful.");
    });
});