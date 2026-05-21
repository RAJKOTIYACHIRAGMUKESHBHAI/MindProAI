# PayPal Sandbox Test Guide

## Getting Sandbox Credentials

### Step 1: Create PayPal Developer Account
1. Go to https://developer.paypal.com
2. Sign up or login with your PayPal account
3. Click "Dashboard" to access developer tools

### Step 2: Create Sandbox Test Accounts
1. Go to "Accounts" section
2. Click "Create Account"
3. Create a Business Account (Merchant)
4. Create a Personal Account (Buyer)

### Step 3: Copy Your Credentials
1. Go to "Apps & Credentials"
2. Select "Sandbox" from the dropdown
3. Under "Default Application":
   - Copy **Client ID**
   - Click "Show" to reveal **Secret**

---

## Testing Payment Flow

### Using the App

1. **Start the Server**
   ```bash
   npm install
   npm start
   ```

2. **Open App**
   - Navigate to http://localhost:3000
   - Login with any email

3. **Upgrade to Premium**
   - Click on "Advance" or "Pro" in version menu
   - App prompts for payment
   - Click payment button

4. **Complete Payment**
   - Redirected to PayPal sandbox
   - Login with sandbox BUYER account
   - Approve payment
   - Returned to app

5. **Verify**
   - Check that tier changed to "Advance" or "Pro"
   - Verify chat limits applied

---

## Sandbox Test Accounts

### Business Account (Merchant)
- Email: `sb-[merchant-id]@business.example.com`
- Password: `[Your developer password]`

### Personal Account (Buyer)
- Email: `sb-[buyer-id]@personal.example.com`
- Password: `[Your developer password]`

---

## Test Credit Cards

Use these for testing without sandbox account:

| Card Number | CVV | Exp Date |
|------------|-----|----------|
| 4532015112830366 | 123 | 12/2025 |
| 5425233010103442 | 222 | 12/2025 |

---

## Common Test Scenarios

### Successful Payment
- Use sandbox buyer account
- Select any plan
- Click "Approve" at PayPal

### Failed Payment
- Use invalid card (in test modes)
- Or decline when prompted

### Check Payment History
```bash
# In MongoDB
db.payments.find({ email: "your-email@example.com" })
```

---

## Switching to LIVE Mode

When ready for production:

1. **Change .env**
   ```env
   PAYPAL_MODE=live
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_secret
   ```

2. **Update index.html**
   ```html
   <script src="https://www.paypal.com/sdk/js?client-id=YOUR_LIVE_CLIENT_ID"></script>
   ```

3. **Set Actual Prices**
   - INR currency support verified
   - ₹150 and ₹300 amounts confirmed

---

## Troubleshooting

### "Invalid client ID"
- Check .env file PAYPAL_CLIENT_ID
- Regenerate credentials if needed

### "Cannot connect to PayPal"
- Verify internet connection
- Check firewall/proxy settings
- Try incognito window

### "Payment approved but not captured"
- Check server logs for `/execute-payment` endpoint
- Verify MongoDB connection
- Check user email in database

---

## Webhook Setup (Optional)

For production, setup webhooks to:
1. Receive payment confirmations
2. Update subscriptions in real-time
3. Handle refunds automatically

In PayPal Dashboard:
1. Go to "My Apps"
2. Select your app
3. Click "Webhooks"
4. Add your endpoint: `https://yourdomain.com/paypal-webhook`

---

## Security Checklist

✅ Never expose Client Secret to frontend
✅ Validate payments server-side
✅ Use HTTPS in production
✅ Verify SSL certificates
✅ Log all payment events
✅ Monitor for fraud patterns
