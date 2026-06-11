/**
 * Agent Configuration
 * Defines the three AI agent packs with their capabilities and API integrations
 */

const agentConfigs = {
    student: {
        name: 'Student Pack',
        icon: '📚',
        color: '#3b82f6',
        description: 'Helps with coding, study materials, and educational content',
        systemPrompt: `You are an expert educational AI assistant specialized in helping students with:
- Code explanations and programming concepts
- Academic subjects and study materials
- Problem-solving and project guidance
- Research and learning resources

Provide clear, concise explanations with code examples when relevant. Use markdown formatting for better readability.
Focus on helping students understand concepts deeply, not just providing answers.`,
        apis: ['github', 'education_content'],
        capabilities: [
            'Code examples and explanations',
            'Algorithm tutorials',
            'Study material research',
            'Homework guidance',
            'Project ideas and guidance'
        ],
        rateLimits: {
            free: 50,
            advance: 200,
            pro: 500
        }
    },
    
    business: {
        name: 'Business Pack',
        icon: '💼',
        color: '#10b981',
        description: 'Analyzes stock markets, business trends, and entrepreneurship',
        systemPrompt: `You are an expert business and finance AI assistant specialized in:
- Stock market analysis and trends
- Entrepreneurship and business strategies
- Financial planning and investment insights
- Market research and competitive analysis
- Business metrics and performance analysis

Provide data-driven insights with real-time market context. Always mention data sources and include risk disclaimers for financial advice.
Help entrepreneurs understand market opportunities and business challenges.`,
        apis: ['alpha_vantage', 'business_news'],
        capabilities: [
            'Stock market analysis',
            'Business trends analysis',
            'Entrepreneurship guidance',
            'Investment insights',
            'Market research',
            'Financial planning'
        ],
        rateLimits: {
            free: 30,
            advance: 150,
            pro: 400
        }
    },
    
    local: {
        name: 'Local Pack',
        icon: '📍',
        color: '#f59e0b',
        description: 'Provides local services, weather, restaurants, and events',
        systemPrompt: `You are a helpful local assistant AI specialized in:
- Weather forecasts and climate information
- Finding nearby restaurants and services
- Local events and entertainment recommendations
- Maps and navigation assistance
- Local business information and recommendations

Provide location-aware suggestions and practical information. Always ask for location context when needed.
Help users discover and navigate local opportunities and services.`,
        apis: ['weather', 'maps', 'restaurants', 'local_events'],
        capabilities: [
            'Weather forecasts',
            'Restaurant recommendations',
            'Local event discovery',
            'Navigation assistance',
            'Local business info',
            'Service recommendations'
        ],
        rateLimits: {
            free: 40,
            advance: 180,
            pro: 450
        }
    }
};

/**
 * Get agent configuration by type
 */
function getAgentConfig(agentType) {
    return agentConfigs[agentType] || agentConfigs.student;
}

/**
 * Get rate limit for a specific agent and tier
 */
function getRateLimit(agentType, tier = 'free') {
    const config = getAgentConfig(agentType);
    return config.rateLimits[tier] || config.rateLimits.free;
}

/**
 * Get system prompt for a specific agent
 */
function getSystemPrompt(agentType) {
    const config = getAgentConfig(agentType);
    return config.systemPrompt;
}

/**
 * Get all agent types
 */
function getAllAgentTypes() {
    return Object.keys(agentConfigs);
}

/**
 * Get all agents with their info
 */
function getAllAgents() {
    return agentConfigs;
}

module.exports = {
    agentConfigs,
    getAgentConfig,
    getRateLimit,
    getSystemPrompt,
    getAllAgentTypes,
    getAllAgents
};
