/**
 * Business Pack Agent
 * Specialized for stock market analysis, business trends, and entrepreneurship
 */

const { fetchStockData, fetchBusinessNews } = require('../tools/apiIntegrations');
const { getSystemPrompt } = require('./agentConfig');

class BusinessAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.type = 'business';
        this.name = '💼 Business Pack';
    }

    /**
     * Get system prompt for business agent
     */
    getSystemPrompt() {
        return getSystemPrompt(this.type);
    }

    /**
     * Process query with business-specific logic
     */
    async processQuery(query, context = {}) {
        let enrichedContext = '';
        
        // Check if query mentions stocks/markets
        if (this.containsKeyword(query, ['stock', 'market', 'price', 'ticker', 'shares', 'investment', 'portfolio', 'bull', 'bear'])) {
            const symbols = this.extractStockSymbols(query);
            if (symbols.length > 0) {
                enrichedContext += '\n📊 **Stock Market Data:**\n';
                
                for (const symbol of symbols.slice(0, 3)) {
                    try {
                        const data = await fetchStockData(symbol);
                        if (data) {
                            enrichedContext += `\n**${data.symbol}**\n`;
                            enrichedContext += `- Price: $${data.price}\n`;
                            enrichedContext += `- Change: ${data.change} (${data.changePercent})\n`;
                            enrichedContext += `- Last Updated: ${data.timestamp}\n`;
                        }
                    } catch (error) {
                        console.error(`Business Agent - Stock fetch error for ${symbol}:`, error.message);
                    }
                }
            }
        }

        // Check if query is about business/entrepreneurship
        if (this.containsKeyword(query, ['business', 'startup', 'entrepreneur', 'market', 'trend', 'industry', 'opportunity', 'investment', 'finance'])) {
            try {
                const news = await fetchBusinessNews(query, 3);
                if (news.length > 0) {
                    enrichedContext += '\n📰 **Latest Business News:**\n';
                    enrichedContext += news.map(article =>
                        `- **${article.title}** (${article.source})\n  ${article.description?.substring(0, 100)}...`
                    ).join('\n\n');
                }
            } catch (error) {
                console.error('Business Agent - News fetch error:', error.message);
            }
        }

        return {
            type: this.type,
            systemPrompt: this.getSystemPrompt(),
            enrichedContext,
            capabilities: this.getCapabilities()
        };
    }

    /**
     * Get business agent capabilities
     */
    getCapabilities() {
        return [
            'Stock market analysis and trends',
            'Real-time market data',
            'Business news and insights',
            'Entrepreneurship guidance',
            'Investment analysis',
            'Market research',
            'Financial planning basics',
            'Competitive analysis'
        ];
    }

    /**
     * Extract stock symbols from query
     */
    extractStockSymbols(text) {
        // Simple regex to find stock ticker symbols (all caps, 1-5 chars)
        const matches = text.match(/\b([A-Z]{1,5})\b/g);
        if (!matches) return [];
        
        // Filter common words that aren't stock symbols
        const excludeWords = ['THE', 'AND', 'OR', 'NOT', 'FOR', 'BUT', 'ARE', 'STOCK', 'MARKET', 'PRICE', 'COMPANY'];
        return matches
            .filter(symbol => !excludeWords.includes(symbol) && symbol.length > 1)
            .slice(0, 5); // Limit to 5 symbols
    }

    /**
     * Check if query contains relevant keywords
     */
    containsKeyword(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    /**
     * Format response for business context
     */
    formatResponse(response, context = {}) {
        let formatted = response;
        
        // Add financial disclaimer if discussing investments
        if (context.includeDisclaimer || formatted.toLowerCase().includes('invest')) {
            formatted += '\n\n⚠️ **Disclaimer:** This information is for educational purposes only and should not be considered as financial advice. Consult with a qualified financial advisor before making investment decisions.';
        }
        
        // Add data source mention
        if (context.mentionSources) {
            formatted += '\n\n📌 *Data sourced from Alpha Vantage, News API, and market databases.*';
        }
        
        return formatted;
    }
}

module.exports = BusinessAgent;
