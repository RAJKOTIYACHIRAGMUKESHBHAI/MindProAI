# Code Changes Summary

## 1. server.js - Key Additions

### PayPal Configuration
```javascript
const paypal = require('paypal-rest-sdk');

paypal.configure({
    mode: process.env.PAYPAL_MODE || 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});
```

### Updated User Schema
```javascript
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
```

### New Payment Schema
```javascript
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
```

### New Endpoints

**1. Create Payment Order**
```javascript
POST /create-payment-order
Body: { email, plan }
Returns: { success, paymentId, approvalUrl }
```

**2. Execute Payment**
```javascript
POST /execute-payment
Body: { paymentId, payerId, email, plan }
Action: Captures PayPal payment, creates subscription
```

**3. Check Subscription Status**
```javascript
POST /subscription-status
Body: { email }
Returns: { subscription, chatCountThisMonth, chatLimit, subscriptionExpiry }
```

### Modified /chat Endpoint
- Now accepts `email` parameter
- Checks monthly chat limit before processing
- Increments `chatCountThisMonth`
- Returns error if limit reached

### Modified /get-chats Endpoint
- Returns subscription info along with chats
- Shows current tier and chat usage

---

## 2. package.json - New Dependency

```json
"paypal-rest-sdk": "^1.7.1"
```

---

## 3. .env - New Variables

```
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_CLIENT_SECRET_HERE
```

---

## 4. index.html - New Additions

### Payment Modal
```html
<div id="payment-modal">
    <!-- Two plan options: Advance (₹150) and Pro (₹300) -->
    <!-- PayPal button container -->
</div>
```

### PayPal SDK Script
```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID"></script>
```

---

## 5. script.js - New Functions

### Payment Functions
```javascript
openPaymentModal()           // Shows payment dialog
closePaymentModal()          // Hides payment dialog
selectPlan(plan)             // User selects Advance or Pro
initiatePayment(plan)        // Starts PayPal checkout
checkSubscriptionStatus()    // Checks user's tier on page load
updateUIWithSubscription()   // Updates UI based on tier
```

### Enhanced selectVersion()
- Now checks if user trying to upgrade without payment
- Shows payment modal if needed
- Updates UI colors based on tier

### Page Load Listener
```javascript
window.addEventListener('load', () => {
    checkSubscriptionStatus();
});
```

---

## 6. Chat Limit Logic

### In /chat Endpoint
```javascript
// Check user's subscription
if (user.subscription === 'advance' && user.chatCountThisMonth >= 20) {
    return error("Chat limit reached");
}
if (user.subscription === 'pro' && user.chatCountThisMonth >= 10) {
    return error("Chat limit reached");
}
// Increment counter
user.chatCountThisMonth += 1;
```

### Monthly Reset
```javascript
// On subscription renewal, reset counter
chatCountThisMonth: 0,
monthResetDate: new Date()
```

---

## 7. Data Flow

### Payment Flow
```
User → Select Plan → PayPal → Approve → /execute-payment → DB Updated → Tier Changed
```

### Chat Limit Flow
```
/chat Request → Check Subscription → Check Limit → Increment Counter → AI Response
```

### Resume Chat Flow
```
Login → /get-chats → Load History → Display Messages → Continue Chat
```

---

## 8. Pricing Tiers

| Tier | Price | Chats | Model |
|------|-------|-------|-------|
| Basic | Free | Unlimited | GPT-4o Mini |
| Advance | ₹150 | 20/month | Llama 3.3 70B |
| Pro | ₹300 | 10/month | DeepSeek R1 |

---

## 9. Testing Checklist

- [ ] PayPal credentials added to .env
- [ ] npm install runs successfully
- [ ] Server starts without errors
- [ ] Login works with any email
- [ ] Version menu shows Advance/Pro options
- [ ] Payment modal opens on tier selection
- [ ] PayPal payment flow completes
- [ ] Subscription updates in database
- [ ] Chat limits enforced
- [ ] Monthly counter increments
- [ ] Chats resume on next login

---

## 10. Important Notes

1. **Sandbox Mode Default**: App starts in sandbox for testing
2. **Monthly Reset**: Counter resets on subscription renewal date
3. **Email Required**: Chat counting requires email in request
4. **Expiry Checking**: Subscription auto-downgrades to free if expired
5. **No Refunds Logic**: Implement separately if needed
