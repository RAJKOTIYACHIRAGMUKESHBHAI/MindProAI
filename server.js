require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const app = express();
app.use(express.static(__dirname));
const path = require('path'); 
app.use(express.json());
const axios = require('axios');
const cors = require('cors');
const nodemailer = require('nodemailer');
const paypal = require('paypal-rest-sdk');
let users = [];


app.use(cors());

// PayPal Configuration
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
    console.log("❌ ERROR: URI abhi bhi theek nahi hai. Kripya .env check karein.");
} else {
    mongoose.connect(dbURI, { family: 4 })
        .then(() => console.log("☁️ ✅ MongoDB Cloud Connected Successfully!"))
        .catch(err => console.log("❌ MongoDB Connection Error:", err.message));
}

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});




const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false }, 
    lastLogin: { type: Date, default: Date.now },
    chats: { type: Array, default: [] },
    subscription: { type: String, enum: ['free', 'advance', 'pro'], default: 'free' },
    subscriptionExpiry: { type: Date, default: null },
    chatCountThisMonth: { type: Number, default: 0 },
    monthResetDate: { type: Date, default: Date.now }
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


const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
let otpStore = {};
const transporter = nodemailer.createTransport({
    service: 'gmail',
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

// PayPal: Create Order for Payment
app.post('/create-payment-order', async (req, res) => {
    const { email, plan } = req.body;

    if (!email || !plan) {
        return res.status(400).json({ success: false, message: "Email and plan required" });
    }

    const planDetails = {
        advance: { price: 150, description: 'Advance Plan - 20 chats/month' },
        pro: { price: 300, description: 'Pro Plan - 10 chats/month' }
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

// PayPal: Capture Payment
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
                            monthResetDate: new Date()
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

// Get Subscription Status
app.post('/subscription-status', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.json({ success: true, subscription: 'free', chatCountThisMonth: 0, chatLimit: -1 });
        }

        // Check if subscription expired
        if (user.subscriptionExpiry && new Date() > user.subscriptionExpiry) {
            user.subscription = 'free';
            user.subscriptionExpiry = null;
            await user.save();
        }

        const chatLimits = { free: -1, advance: 20, pro: 10 };

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

app.post('/chat', async (req, res) => {
    const { tier, model, messages, email } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ reply: "⚠️ Invalid data: Messages array is missing." });
    }

    // Check chat limit if email provided
    if (email) {
        try {
            const user = await User.findOne({ email: email.toLowerCase().trim() });
            if (user) {
                const chatLimits = { free: -1, advance: 20, pro: 10 };
                const limit = chatLimits[user.subscription] || -1;

                if (limit > 0 && user.chatCountThisMonth >= limit) {
                    return res.status(429).json({ 
                        reply: `⚠️ Chat limit reached for this month (${limit} chats). Upgrade your plan to continue.` 
                    });
                }

                // Increment chat count
                user.chatCountThisMonth += 1;
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
        selectedModel = "meta-llama/llama-3.3-70b-instruct";
        tokenLimit = 2500;
    } else if (tier === 'pro') {
        selectedModel = "deepseek/deepseek-r1-distill-llama-70b";
        tokenLimit = 4000;
    } else if (model) {
        selectedModel = model; 
    }

    console.log(`📡 Processing request... Tier: [${tier || 'basic'}] | Model: ${selectedModel}`);

    const systemPrompt = {
        role: "system",
        content: "You are a helpful, highly intelligent, and professional AI assistant. Always provide clear, accurate answers. Format your responses beautifully using Markdown, bullet points, and code blocks where necessary."
    };

    const finalMessages = [systemPrompt, ...messages.flat()];

    try {
        const response = await axios.post("https://openrouter.io/api/v1/chat/completions", {
            model: selectedModel, 
            messages: finalMessages,
            max_tokens: 2000
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Mind-Pro AI Web App"
            }
        });

        const aiReply = response.data.choices[0].message.content;
        res.json({ reply: aiReply });

    } catch (error) {
        console.error("❌ OpenRouter Error Detail:", error.response ? error.response.data : error.message);
        console.error("Error Detail:", error.response ? error.response.data : error.message);
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

const PORT = process.env.PORT || 3000;

console.log("TESTING ENV USER:", process.env.EMAIL_USER);
console.log("TESTING ENV PASS:", process.env.EMAIL_PASS ? "Password Loaded" : "Password Missing");
app.listen(PORT, () => console.log(`🚀 Server is running smoothly on port ${PORT}`));