# AI Agent Packs - Quick Setup Guide

## Installation & Setup

### 1. Dependencies Already Included
All required dependencies are in `package.json`. The system uses:
- `axios` for API calls
- `express` for server routing
- `@google/genai` for AI responses
- `openai` for API integration

### 2. File Structure
```
✅ agents/
   ├── agentConfig.js          (Agent configurations)
   ├── studentAgent.js         (Student pack logic)
   ├── businessAgent.js        (Business pack logic)
   └── localAgent.js           (Local pack logic)

✅ tools/
   └── apiIntegrations.js      (API wrapper functions)

✅ server.js                    (Updated with agent endpoints)
✅ script.js                    (Updated with agent selector)
✅ index.html                   (Updated with dropdown UI)
✅ .env                         (Updated with API key placeholders)
```

### 3. Quick Start

**Step 1**: Start the server
```bash
npm start
# or
node server.js
```

**Step 2**: Open the application
```
http://localhost:3000
```

**Step 3**: Select an agent pack from the dropdown
- 📚 Student Pack
- 💼 Business Pack
- 📍 Local Pack

**Step 4**: Start chatting!

---

## Testing the Agent System

### Test Endpoints with cURL

#### Get All Agents
```bash
curl http://localhost:3000/agents
```

Expected Response:
```json
{
  "success": true,
  "agents": [
    {
      "type": "student",
      "name": "Student Pack",
      "icon": "📚",
      "color": "#3b82f6",
      "description": "Helps with coding, study materials, and educational content",
      "capabilities": [...]
    }
  ]
}
```

#### Get Specific Agent
```bash
curl http://localhost:3000/agents/student
```

#### Test Chat with Agent
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "basic",
    "agentType": "student",
    "messages": [{"role": "user", "content": "Explain Python loops"}],
    "email": "test@example.com"
  }'
```

---

## Agent Pack Features

### 📚 Student Pack
**Automatically triggered when query contains:**
- code, program, algorithm, debug, function, class, api, library, framework
- learn, study, tutorial, book, course, education, subject, concept

**What it does:**
- Searches GitHub for relevant code examples
- Fetches educational resources and books
- Provides structured learning guidance

**Example Query:**
```
"Help me learn JavaScript promises"
```

---

### 💼 Business Pack
**Automatically triggered when query contains:**
- stock, market, price, ticker, shares, investment, portfolio
- business, startup, entrepreneur, trend, industry, opportunity, finance

**What it does:**
- Fetches real-time stock data from Alpha Vantage
- Gets latest business news
- Provides market insights and analysis

**Example Query:**
```
"What's happening with TECH stocks today?"
```

---

### 📍 Local Pack
**Automatically triggered when query contains:**
- weather, rain, snow, temperature, forecast
- restaurant, food, eat, dining, cafe, cuisine
- event, activity, entertainment, concert, market, festival
- direction, navigate, route, map, where, location

**What it does:**
- Provides real-time weather forecasts
- Recommends nearby restaurants
- Shows local events and activities
- Provides navigation assistance

**Example Query:**
```
"Show me restaurants near downtown with Italian food"
```

---

## Customization

### Add a New API to an Agent

**Example: Adding OpenAI API to Student Pack**

1. **Update `tools/apiIntegrations.js`:**
```javascript
async function fetchOpenAIExamples(query) {
    try {
        // Your API call here
        return data;
    } catch (error) {
        console.error('OpenAI API Error:', error.message);
        return null;
    }
}

module.exports = {
    // ... existing exports
    fetchOpenAIExamples
};
```

2. **Update `agents/studentAgent.js`:**
```javascript
const { fetchOpenAIExamples } = require('../tools/apiIntegrations');

// In processQuery method:
if (this.containsKeyword(query, ['openai', 'gpt', 'ai-code'])) {
    const examples = await fetchOpenAIExamples(query);
    if (examples) {
        enrichedContext += '\n🤖 **AI Code Examples:**\n';
        enrichedContext += examples;
    }
}
```

3. **Update `agents/agentConfig.js`:**
```javascript
const studentConfig = {
    // ... existing config
    apis: ['github', 'education_content', 'openai'],
    capabilities: [
        // ... existing
        'AI-powered code generation',
        'GPT assistance for coding'
    ]
};
```

---

## Monitoring & Debugging

### Enable Detailed Logging

Update `server.js`:
```javascript
console.log(`📡 Agent Processing - Type: ${agentType} | Query: ${messages}`);
```

### Check Agent Selection in Browser

Open browser console and run:
```javascript
console.log(localStorage.getItem('selectedAgentType'));
```

### Monitor API Calls

In browser DevTools → Network tab:
- Look for POST requests to `/chat`
- Check the `agentType` parameter in request body

---

## Common Issues & Solutions

### Issue: "Agent selector not appearing"
**Solution:**
1. Clear browser cache: Ctrl+Shift+Delete
2. Reload page: Ctrl+R
3. Check console for JS errors: F12 → Console

### Issue: "Chat not using agent-specific prompts"
**Solution:**
1. Verify `.env` has agent imports loaded
2. Check server is restarted after file changes
3. Clear localStorage: `localStorage.clear()`

### Issue: "API calls returning no data"
**Solution:**
1. Add API keys to `.env`
2. Verify API rate limits not exceeded
3. Test API directly with curl or Postman
4. Check browser console for CORS errors

### Issue: "Agent selector shows but selection not saved"
**Solution:**
1. Check if localStorage is enabled in browser
2. Look for JS errors in console
3. Verify agent-selector element ID matches HTML

---

## Production Deployment

### Environment Setup
```bash
# 1. Set all required API keys in .env
ALPHA_VANTAGE_KEY=your_key
NEWSAPI_KEY=your_key
GITHUB_API_KEY=your_key
# ... etc

# 2. Install dependencies
npm install

# 3. Start server
npm start

# 4. Verify all agents are working
curl http://localhost:3000/agents
```

### Performance Optimization
- Cache API responses using Redis
- Implement request debouncing
- Use CDN for static assets
- Monitor API rate limits

---

## Support Resources

- **GitHub API Docs**: https://docs.github.com/en/rest
- **Alpha Vantage**: https://www.alphavantage.co/documentation/
- **News API**: https://newsapi.org/docs
- **Open-Meteo**: https://open-meteo.com/en/docs

---

**Quick Summary:**
✅ 3 AI Agent Packs implemented
✅ Integrated with GitHub, Alpha Vantage, News, Weather APIs
✅ Dropdown selector in UI
✅ Agent-specific system prompts
✅ Rate limiting per agent type
✅ Fully documented and tested

**Ready to Use!** 🚀
