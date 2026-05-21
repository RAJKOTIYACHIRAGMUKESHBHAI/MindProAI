# 🎯 PayPal Payment Integration - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (index.html)                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Version Menu                                    │   │
│  │  [🍃 Basic]  [⚡ Advance]  [👑 Pro]             │   │
│  │                                                  │   │
│  │  When user clicks Advance/Pro:                  │   │
│  │  → Payment Modal appears                        │   │
│  │  → Plan options shown                           │   │
│  │  → PayPal button triggered                      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Payment Modal                                   │   │
│  │  ┌────────────────┬────────────────────────────┐ │   │
│  │  │ Advance: ₹150  │ Pro: ₹300                 │ │   │
│  │  │ 20 chats/mo    │ 10 chats/mo               │ │   │
│  │  │ [Pay with PayPal]  [PayPal]               │ │   │
│  │  └────────────────┴────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  script.js (Payment Functions)                         │
│  - openPaymentModal()                                  │
│  - selectPlan()                                        │
│  - initiatePayment()                                   │
│  - checkSubscriptionStatus()                          │
│  - updateUIWithSubscription()                         │
└─────────────────────────────────────────────────────────┘
             ↓ (API Calls)
┌─────────────────────────────────────────────────────────┐
│                 Backend (server.js)                     │
│                                                          │
│  PayPal Configuration                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ mode: sandbox/live                              │   │
│  │ client_id: from .env                            │   │
│  │ client_secret: from .env                        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Endpoints                                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ POST /create-payment-order                       │   │
│  │ ├─ Create PayPal order                          │   │
│  │ ├─ Return approval URL                          │   │
│  │ └─ Save pending payment                         │   │
│  │                                                  │   │
│  │ POST /execute-payment                           │   │
│  │ ├─ Capture approved payment                     │   │
│  │ ├─ Update user subscription                     │   │
│  │ ├─ Set expiry date (30 days)                    │   │
│  │ ├─ Reset chat counter                           │   │
│  │ └─ Log payment to database                      │   │
│  │                                                  │   │
│  │ POST /subscription-status                       │   │
│  │ ├─ Check current tier                           │   │
│  │ ├─ Verify expiry date                           │   │
│  │ ├─ Check chat usage                             │   │
│  │ └─ Auto-downgrade if expired                    │   │
│  │                                                  │   │
│  │ POST /chat (MODIFIED)                           │   │
│  │ ├─ Check subscription from DB                   │   │
│  │ ├─ Verify monthly limit not reached             │   │
│  │ ├─ Increment chat counter                       │   │
│  │ └─ Call AI API                                  │   │
│  │                                                  │   │
│  │ POST /get-chats (MODIFIED)                      │   │
│  │ └─ Return chats + subscription info             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Models                                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ User                      │  Payment            │   │
│  │ - email                   │  - email            │   │
│  │ - isVerified              │  - orderId          │   │
│  │ - chats: []               │  - plan             │   │
│  │ - subscription: str       │  - amount           │   │
│  │ - subscriptionExpiry      │  - status           │   │
│  │ - chatCountThisMonth      │  - paymentDate      │   │
│  │ - monthResetDate          │  - expiryDate       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
             ↓ (Database Operations)
┌─────────────────────────────────────────────────────────┐
│              MongoDB (Data Storage)                     │
│                                                          │
│  Collections:                                           │
│  ├─ users          (subscription info, chat history)    │
│  ├─ payments       (payment records)                    │
│  └─ user_sessions  (login tracking)                    │
│                                                          │
│  Key Indexes:                                           │
│  ├─ users.email (unique)                               │
│  └─ payments.orderId (unique)                          │
└─────────────────────────────────────────────────────────┘
```

---

## User Journey - Payment Flow

```
1. User Opens App
   └─ Logs in with email
   └─ /verify-otp stores email in localStorage
   └─ Page load → checkSubscriptionStatus()
   
2. User Sees Version Menu
   ├─ 🍃 Basic (Free)
   ├─ ⚡ Advance (Locked)
   └─ 👑 Pro (Locked)

3. User Clicks "Advance"
   └─ selectVersion('advance') called
   └─ Check if subscription exists
   └─ If not → openPaymentModal()
   
4. Payment Modal Appears
   ├─ Option 1: Advance - ₹150
   ├─ Option 2: Pro - ₹300
   └─ User clicks option
   
5. initiatePayment() Called
   └─ POST /create-payment-order
   └─ Backend creates PayPal order
   └─ Returns approval URL
   └─ window.location.href redirects to PayPal
   
6. PayPal Sandbox
   ├─ User logs in
   ├─ Reviews order (₹150 or ₹300)
   ├─ Approves payment
   └─ PayPal redirects back with payerId
   
7. execute-payment() Called
   └─ Frontend detects return URL
   └─ POST /execute-payment with payerId
   └─ Backend captures payment
   └─ User subscription updated
   └─ Chat counter reset to 0
   
8. Success!
   ├─ Browser shows success message
   ├─ Tier changed to Advance/Pro
   ├─ UI colors updated
   ├─ 20/10 chats available
   └─ Resume chats = full history loaded

9. Monthly Limit Enforcement
   ├─ Each chat: POST /chat with email
   ├─ Backend checks: user.chatCountThisMonth < limit
   ├─ If OK: increment counter, process AI
   ├─ If Limit: return error "limit reached"
   └─ Each month: auto-reset on renewal date
```

---

## Data Flow - Chat with Limit

```
Frontend                    Backend                 Database
   │                           │                        │
   │ POST /chat                │                        │
   │ {email, messages}         │                        │
   ├────────────────────────→  │                        │
   │                           │ SELECT user            │
   │                           ├──────────────────────→ │
   │                           │                ← User  │
   │                           │                        │
   │                           │ Check limit:           │
   │                           │ If chatCount ≥ 20/10   │
   │                           │   → Return ERROR       │
   │                           │                        │
   │                           │ Else:                  │
   │                           │ chatCount++            │
   │                           │ Call OpenRouter API    │
   │                           │ Get AI response        │
   │                           │                        │
   │                           │ UPDATE chatCount       │
   │                           ├──────────────────────→ │
   │                           │                        │
   │ ← {reply: "..."}          │                        │
   │←────────────────────────── │                        │
   │                           │                        │
   │ Display message           │                        │
   │ Save locally              │                        │
   │                           │                        │
   │ Later: POST /save-chats   │                        │
   ├────────────────────────→  │                        │
   │                           │ UPDATE user.chats      │
   │                           ├──────────────────────→ │
   │                           │                 ← OK   │
   │ ← {success: true}         │                        │
   │←────────────────────────── │                        │
   │                           │                        │
```

---

## Monthly Subscription Timeline

```
Day 1: Payment Captured
├─ subscriptionExpiry = Today + 30 days
├─ chatCountThisMonth = 0
└─ monthResetDate = Today

Days 2-30: Using Chats
├─ Each message increments chatCountThisMonth
├─ At limit: blocked until next month
└─ Full chat history saved

Day 30: Expiry Warning
├─ subscription-status shows expiry date
└─ UI shows "Expires in 1 day"

Day 31: Auto-Downgrade
├─ checkSubscriptionStatus() detects expiry
├─ subscription = 'free'
├─ chatCountThisMonth = 0
├─ monthResetDate = Today
└─ Back to unlimited chats (Basic tier)
```

---

## Price Tiers Comparison

```
╔════════════╦═══════════╦════════════╦══════════════════╗
║ Feature    ║  Basic    ║  Advance   ║      Pro         ║
╠════════════╬═══════════╬════════════╬══════════════════╣
║ Price      ║ FREE      ║ ₹150/mo    ║ ₹300/mo          ║
║ Chats/mo   ║ Unlimited ║ 20         ║ 10               ║
║ Model      ║ GPT-4o    ║ Llama 3.3  ║ DeepSeek R1      ║
║            ║ Mini      ║ 70B        ║ Distill 70B      ║
║ Upload     ║ No        ║ Yes        ║ Yes              ║
║ Speed      ║ Standard  ║ Fast       ║ Fastest          ║
║ Quality    ║ Good      ║ Better     ║ Best             ║
╚════════════╩═══════════╩════════════╩══════════════════╝
```

---

## File Organization

```
chatapp/
├── server.js                    (PayPal + endpoints)
├── script.js                    (Payment functions)
├── index.html                   (Payment modal)
├── package.json                 (paypal-rest-sdk)
├── .env                         (PayPal credentials)
│
├── Documentation/
├── QUICK_START.md              (3-min setup)
├── PAYPAL_SETUP.md             (Detailed setup)
├── SANDBOX_TESTING.md          (Testing guide)
├── PAYMENT_IMPLEMENTATION.md   (Full docs)
├── CODE_CHANGES.md             (Code reference)
└── This file (VISUAL_GUIDE.md)

Database:
├── users              (subscription + chats)
├── payments           (payment records)
└── sessions           (auth sessions)
```

---

## Environment Setup

```env
# Sandbox (Testing)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=AbcD123...
PAYPAL_CLIENT_SECRET=XyzW456...

# Live (Production - later)
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=Live123...
PAYPAL_CLIENT_SECRET=Live456...

# Database
MONGO_URI=mongodb://localhost:27017/mindproAI

# Email
EMAIL_USER=mindproai@gmail.com
EMAIL_PASS=qoeiiwlmcajjblin

# API
OPENROUTER_API_KEY=sk-or-v1-...
PORT=3000
```

---

## Success Indicators ✅

- ✅ PayPal modal opens when selecting Advance/Pro
- ✅ Payment redirects to PayPal sandbox
- ✅ User can approve/decline payment
- ✅ Returns to app with success/cancel
- ✅ Subscription updates in MongoDB
- ✅ UI tier changes with colors
- ✅ Chat counter shows usage (e.g., "3/20 chats")
- ✅ Blocked at limit with upgrade prompt
- ✅ Monthly counter resets on renewal
- ✅ Chat history persists across logins
