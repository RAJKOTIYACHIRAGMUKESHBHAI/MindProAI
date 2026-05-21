# PayPal Payment Integration Setup

## Quick Setup Guide

### Step 1: Get PayPal Credentials
1. Go to https://developer.paypal.com
2. Sign in or create a business account
3. Navigate to "Apps & Credentials"
4. Select "Sandbox" mode (for testing)
5. Copy your Client ID and Client Secret

### Step 2: Update .env File
Replace the placeholder values in `.env`:

```
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_ACTUAL_CLIENT_SECRET
```

### Step 3: Update PayPal SDK in index.html
Find this line in `index.html`:
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID"></script>
```

Replace `YOUR_PAYPAL_CLIENT_ID` with your actual Client ID from PayPal.

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Start Server
```bash
npm start
```

## Subscription Tiers

- **Free/Basic**: Unlimited chats
- **Advance**: ₹150/month - 20 chats/month
- **Pro**: ₹300/month - 10 chats/month

## Testing in Sandbox

Use PayPal sandbox test accounts for payments:
- Business Account: sb-[business-id]@business.example.com
- Personal Account: sb-[personal-id]@personal.example.com

Password: (same as your developer account password)

## Features Implemented

✅ PayPal payment integration
✅ Monthly chat limits per tier
✅ Subscription tracking
✅ Resume chats with history
✅ Auto-reset monthly limits
✅ Payment status checking

## API Endpoints

- `POST /create-payment-order` - Create PayPal order
- `POST /execute-payment` - Capture payment after approval
- `POST /subscription-status` - Check user subscription
- `POST /chat` - Send message (with limit checking)

## Files Modified

- `server.js` - Added payment endpoints
- `package.json` - Added paypal-rest-sdk
- `index.html` - Added payment modal
- `script.js` - Added payment functions
- `.env` - Added PayPal credentials
