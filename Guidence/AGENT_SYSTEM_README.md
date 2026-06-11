# AI Agent Packs - Documentation

## Overview

The Mind-Pro AI application now includes **three specialized AI Agent Packs**, each tailored for specific use cases:

### 1. 📚 **Student Pack**
- **Purpose**: Helps students with coding, study materials, and educational content
- **Focus**: Code explanations, algorithms, tutorials, homework guidance, project ideas
- **APIs Integrated**: GitHub API, Educational Content APIs
- **Capabilities**:
  - Code examples and explanations
  - Algorithm tutorials
  - Study material research
  - Homework guidance
  - Project ideas and guidance

### 2. 💼 **Business Pack**
- **Purpose**: Analyzes stock markets, business trends, and entrepreneurship
- **Focus**: Financial analysis, market insights, business strategies
- **APIs Integrated**: Alpha Vantage (Stock data), Business News APIs
- **Capabilities**:
  - Stock market analysis and real-time data
  - Business trends analysis
  - Entrepreneurship guidance
  - Investment insights
  - Market research
  - Financial planning basics
  - Competitive analysis

### 3. 📍 **Local Pack**
- **Purpose**: Provides local services, weather, restaurants, and events
- **Focus**: Location-aware recommendations and practical local information
- **APIs Integrated**: Weather API, Maps/Navigation, Restaurant finder, Local Events
- **Capabilities**:
  - Real-time weather forecasts
  - Restaurant recommendations
  - Local event discovery
  - Navigation and directions
  - Local business information
  - Service recommendations

---

## How to Use

### Selecting an Agent Pack

1. Navigate to the chat interface
2. Look for the **"AI Agent Pack"** dropdown selector at the top of the chat window
3. Choose from:
   - 📚 **Student Pack** - Code & Study Materials
   - 💼 **Business Pack** - Stock Market & Entrepreneurship
   - 📍 **Local Pack** - Local Services & Weather

The selected agent pack is automatically saved in your browser's local storage for future sessions.

### Example Queries by Agent

#### Student Pack Examples:
- "Explain how recursion works in Python"
- "Show me JavaScript async/await patterns"
- "Help me understand data structures"
- "Find tutorials on machine learning"
- "How do I debug this code?"

#### Business Pack Examples:
- "What's the current stock price for AAPL?"
- "Analyze trends in the tech industry"
- "How do I start a business?"
- "What are the latest business news?"
- "Explain investment strategies"

#### Local Pack Examples:
- "What's the weather in New York tomorrow?"
- "Find restaurants near me"
- "Show me events happening this weekend"
- "How do I get to the nearest hospital?"
- "Recommend local cafes and activities"

---

## Architecture

### File Structure

```
agents/
├── agentConfig.js      # Agent configurations and system prompts
├── studentAgent.js     # Student pack implementation
├── businessAgent.js    # Business pack implementation
└── localAgent.js       # Local pack implementation

tools/
└── apiIntegrations.js  # API integration utilities for all packs

server.js              # Updated with agent routing endpoints
script.js              # Frontend agent selector and chat logic
index.html             # Updated with agent pack dropdown UI
```

### Backend Endpoints

#### Get All Available Agents
```
GET /agents
Response: {
  "success": true,
  "agents": [
    {
      "type": "student",
      "name": "Student Pack",
      "icon": "📚",
      "color": "#3b82f6",
      "description": "...",
      "capabilities": [...]
    },
    ...
  ]
}
```

#### Get Specific Agent Details
```
GET /agents/:agentType
Response: {
  "success": true,
  "agent": { ... agent details ... }
}
```

#### Chat with Agent Support
```
POST /chat
Body: {
  "tier": "basic",
  "agentType": "student",
  "messages": [{ role: "user", content: "..." }],
  "email": "user@example.com"
}
Response: {
  "reply": "AI response...",
  "agentType": "student"
}
```

---

## Configuration

### Environment Variables

Add these to your `.env` file to enable full API integration:

```bash
# Student Pack APIs
GITHUB_API_KEY=your_github_api_key
EDUCATION_API_KEY=your_education_api_key

# Business Pack APIs
ALPHA_VANTAGE_KEY=your_alpha_vantage_key
NEWSAPI_KEY=your_newsapi_key

# Local Pack APIs
WEATHERAPI_KEY=your_weatherapi_key
OPENWEATHER_KEY=your_openweather_key
GOOGLE_MAPS_KEY=your_google_maps_key
```

### Rate Limits per Agent

Different agent packs have different rate limits based on subscription tier:

| Agent | Free | Advance | Pro |
|-------|------|---------|-----|
| Student | 50 queries/month | 200 queries/month | 500 queries/month |
| Business | 30 queries/month | 150 queries/month | 400 queries/month |
| Local | 40 queries/month | 180 queries/month | 450 queries/month |

---

## System Prompts

Each agent pack has a specialized system prompt that guides the AI's behavior:

### Student Pack System Prompt
```
You are an expert educational AI assistant specialized in helping students with:
- Code explanations and programming concepts
- Academic subjects and study materials
- Problem-solving and project guidance
- Research and learning resources

Provide clear, concise explanations with code examples when relevant. 
Focus on helping students understand concepts deeply.
```

### Business Pack System Prompt
```
You are an expert business and finance AI assistant specialized in:
- Stock market analysis and trends
- Entrepreneurship and business strategies
- Financial planning and investment insights
- Market research and competitive analysis
- Business metrics and performance analysis

Provide data-driven insights with real-time market context.
Always include risk disclaimers for financial advice.
```

### Local Pack System Prompt
```
You are a helpful local assistant AI specialized in:
- Weather forecasts and climate information
- Finding nearby restaurants and services
- Local events and entertainment recommendations
- Maps and navigation assistance
- Local business information and recommendations

Provide location-aware suggestions and practical information.
```

---

## API Integrations

### Student Pack
- **GitHub API**: Fetches repositories matching educational queries
- **Open Library API**: Fetches educational books and resources

### Business Pack
- **Alpha Vantage**: Real-time stock market data (5 API calls/minute free tier)
- **News API**: Latest business and market news

### Local Pack
- **Open-Meteo**: Free weather data (no API key required)
- **OpenStreetMap Nominatim**: Geocoding and location data
- **Mock Data**: Restaurants, events (can be replaced with Google Places, Yelp)

---

## Getting API Keys

### GitHub API
1. Go to https://github.com/settings/tokens
2. Create a new personal access token
3. Copy the token and add to .env

### Alpha Vantage
1. Go to https://www.alphavantage.co/api/
2. Request a free API key
3. Free tier: 5 calls/minute, 500/day

### News API
1. Go to https://newsapi.org/
2. Sign up for free account
3. Get your API key from dashboard

### OpenWeather
1. Go to https://openweathermap.org/api
2. Create account and get free API key
3. Free tier: 1000 calls/day

---

## Development Notes

### Adding New APIs to an Agent

To add a new API to an agent pack:

1. **Create API wrapper** in `tools/apiIntegrations.js`
   ```javascript
   async function fetchNewData(query) {
       try {
           const response = await axios.get('https://api.example.com/...', {
               params: { ... }
           });
           return response.data;
       } catch (error) {
           console.error('API Error:', error.message);
           return null;
       }
   }
   ```

2. **Update agent** in the respective agent file (e.g., `studentAgent.js`)
   ```javascript
   if (this.containsKeyword(query, ['keyword1', 'keyword2'])) {
       const data = await fetchNewData(query);
       enrichedContext += formatData(data);
   }
   ```

3. **Add environment variable** to `.env`

4. **Update capabilities** in `agentConfig.js`

---

## Troubleshooting

### Agent selector not showing
- Clear browser cache and reload
- Check that `index.html` has the agent selector HTML

### API calls failing silently
- Check if API keys are properly set in `.env`
- Check browser console for error messages
- Verify API rate limits haven't been exceeded

### Agent response not using specialized prompts
- Clear browser session storage
- Verify `agentType` is being sent in POST request
- Check server logs for agent type being processed

---

## Future Enhancements

1. **Persistent user preferences** - Save agent preferences to database
2. **Agent combination mode** - Use multiple agents for complex queries
3. **Custom agent creation** - Allow users to create custom agents
4. **Agent performance analytics** - Track which agents are used most
5. **Real-time data caching** - Cache API responses for better performance
6. **Machine learning** - Recommend best agent based on query type
7. **Voice agent selection** - Voice commands to switch agents
8. **Agent feedback system** - Users rate agent responses for improvement

---

## Support & Contributions

For issues, feature requests, or contributions related to the agent system:
- Check existing documentation
- Review agent configuration in `agentConfig.js`
- Test with different query types
- Submit detailed error logs with system information

---

**Last Updated**: June 2026
**Version**: 1.0
**Status**: Production Ready
