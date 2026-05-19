require('dotenv').config();

const mongoose = require('mongoose'); // Yeh add karna zaroori hai
const express = require('express');
const app = express();
app.use(express.json());
const axios = require('axios');
const cors = require('cors');
const nodemailer = require('nodemailer');
let users = [];


app.use(cors());

// 1. Pehle check karte hain ki .env se kya aa raha hai
console.log("🔍 DEBUG - Raw MONGO_URI:", process.env.MONGO_URI);

// 2. Link ko automatic clean karte hain (quotes ya space hatane ke liye)
let dbURI = process.env.MONGO_URI ? String(process.env.MONGO_URI) : "";
dbURI = dbURI.replace(/['"]/g, '').trim(); // Galti se aaye quotes aur spaces hata dega

console.log("🛠️ DEBUG - Cleaned URI:", dbURI.substring(0, 20) + "..."); // Sirf shuruwat dikhayega security ke liye

// 3. Database se connect karte hain
if (!dbURI.startsWith("mongodb")) {
    console.log("❌ ERROR: URI abhi bhi theek nahi hai. Kripya .env check karein.");
} else {
    // Yahan mongoose.connect ke andar family: 4 option pass karein
    mongoose.connect(dbURI, { family: 4 })
        .then(() => console.log("☁️ ✅ MongoDB Cloud Connected Successfully!"))
        .catch(err => console.log("❌ MongoDB Connection Error:", err.message));
}



// ✅ SAHI CODE:
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false }, 
    lastLogin: { type: Date, default: Date.now },
    chats: { type: Array, default: [] } 
});

// Purani dono lines hata kar sirf yeh EK line rakhein:
const User = mongoose.model('User', UserSchema); 


const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
//OTP store
let otpStore = {};
// 📧 REAL EMAIL CONFIGURATION
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// Server start hote hi SMTP check kar lega
transporter.verify((error, success) => {
    if (error) {
        console.log("⚠️ SMTP Warning (Check credentials or internet):", error.message);
    } else {
        console.log("✅ Mail Server is locked and ready!");
    }
});
// server.js mein ye route add karein (app.post('/verify-otp') ke upar)
app.post('/send-otp', async (req, res) => {
    let { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }
    email = email.trim().toLowerCase();

    const otp = Math.floor(100000 + Math.random() * 900000); // 6 Digit OTP
    otpStore[email] = otp;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code' + otp,
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
        // Inputs ko ek hi baar naye naam se declare karein taaki conflict na ho
        const inputEmail = req.body.email ? req.body.email.toLowerCase().trim() : "";
        const inputOtp = req.body.otp ? String(req.body.otp).trim() : "";

        // 1. Check OTP (otpStore se)
        if (otpStore[inputEmail] && String(otpStore[inputEmail]) === inputOtp) {
            delete otpStore[inputEmail];

            // 2. Database mein User dhundhein
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
                // Existing User Login logic
                user.isVerified = true;
                user.lastLogin = Date.now();
                await user.save();

                // Agar chats khali hain toh bhi naya user treat karein
                isNewUserFlag = !(user.chats && user.chats.length > 0);
                console.log(`🏠 Existing User Login: ${inputEmail}`);
            }

            // 3. Response bhejein
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

// 3. API Route: Chats Save karne ke liye
app.post('/save-chats', async (req, res) => {
    const { email, chats } = req.body;

    // Terminal mein check karne ke liye log
    console.log("Received save request for:", email);
    console.log("Chat count:", chats ? chats.length : 0);
    try {

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is missing" });
        }
        const result = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { $set: { chats: chats } }, // '$set' ka use karein
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

// 4. API Route: Purani Chats Load karne ke liye
app.post('/get-chats', async (req, res) => {
    try {
        const { email } = req.body;

        // MongoDB se user find karo
        const user = await User.findOne({ email: email });

        if (user) {
            res.json({
                success: true,
                chats: user.chats || []
            });
        } else {
            res.json({
                success: true,
                chats: []
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


app.post('/chat', async (req, res) => {
    // Ab hum frontend se sirf ek 'prompt' nahi, pura 'messages' ka array (history) le rahe hain
    const { model, messages } = req.body;

    // 1. SYSTEM PROMPT: AI ko batana ki use kaise behave karna hai
    const systemPrompt = {
        role: "system",
        content: "You are a helpful, highly intelligent, and professional AI assistant. Always provide clear, accurate answers. Format your responses beautifully using Markdown, bullet points, and code blocks where necessary."
    };

    // 2. Chat History aur System Prompt ko jod kar final list banana
    const finalMessages = [systemPrompt, ...messages];

    try {
        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "openai/gpt-4o-mini",
            messages: finalMessages // Pura chat sequence bhej rahe hain
        }, {
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Multi-AI Web App"
            }
        });

        const aiReply = response.data.choices[0].message.content;
        res.json({ reply: aiReply });

    } catch (error) {
        console.error("Error Detail:", error.response ? error.response.data : error.message);
        res.status(500).json({ reply: "⚠️ API Error: Server ya Model mein koi problem hai." });
    }
});

const cron = require('node-cron');
const { exec } = require('child_process');

// Schedule: Runs every night at 2:00 AM
cron.schedule('0 2 * * *', () => {
    console.log("⏰ Auto-Backup: Starting scheduled task...");
    exec('node backup.js', (error) => {
        if (error) console.error("❌ Auto-Backup Failed:", error);
        else console.log("✅ Auto-Backup Successful.");
    });
});

// File ke bilkul niche ise update karein:
const PORT = process.env.PORT || 3000;

console.log("TESTING ENV USER:", process.env.EMAIL_USER);
console.log("TESTING ENV PASS:", process.env.EMAIL_PASS ? "Password Loaded" : "Password Missing");
app.listen(PORT, () => console.log(`🚀 Server is running smoothly on port ${PORT}`));