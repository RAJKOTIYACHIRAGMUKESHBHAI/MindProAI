const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String },
    isVerified: { type: Boolean, default: false },
    // Isi array mein saari purani chats save hongi
    chats: [
        {
            role: { type: String }, // 'user' ya 'model'
            text: { type: String }, 
            timestamp: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('User', userSchema);