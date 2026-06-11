/**
 * Student Pack Agent
 * Specialized for education, coding, and study materials
 */

const { fetchGithubRepos, fetchEducationalContent, formatDataForAgent } = require('../tools/apiIntegrations');
const { getSystemPrompt } = require('./agentConfig');

class StudentAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.type = 'student';
        this.name = '📚 Student Pack';
    }

    /**
     * Get system prompt for student agent
     */
    getSystemPrompt() {
        return getSystemPrompt(this.type);
    }

    /**
     * Process query with student-specific logic
     */
    async processQuery(query, context = {}) {
        let enrichedContext = '';
        
        // Check if query mentions coding/programming
        if (this.containsKeyword(query, ['code', 'program', 'algorithm', 'debug', 'function', 'class', 'api', 'library', 'framework'])) {
            try {
                const repos = await fetchGithubRepos(query, 3);
                if (repos.length > 0) {
                    enrichedContext += '\n📚 **Related Code Examples:**\n';
                    enrichedContext += repos.map(repo => 
                        `- [${repo.name}](${repo.url}) (${repo.language}) - ⭐ ${repo.stars}`
                    ).join('\n');
                }
            } catch (error) {
                console.error('Student Agent - GitHub fetch error:', error.message);
            }
        }

        // Check if query is about learning/study material
        if (this.containsKeyword(query, ['learn', 'study', 'tutorial', 'book', 'course', 'education', 'subject', 'concept'])) {
            try {
                const content = await fetchEducationalContent(query);
                if (content.length > 0) {
                    enrichedContext += '\n📖 **Recommended Learning Resources:**\n';
                    enrichedContext += content.map(item =>
                        `- **${item.title}** by ${item.author} (${item.year})`
                    ).join('\n');
                }
            } catch (error) {
                console.error('Student Agent - Content fetch error:', error.message);
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
     * Get student agent capabilities
     */
    getCapabilities() {
        return [
            'Code examples and explanations',
            'Algorithm and data structure tutorials',
            'Study material research',
            'Homework and project guidance',
            'Programming best practices',
            'Learning path recommendations'
        ];
    }

    /**
     * Check if query contains relevant keywords
     */
    containsKeyword(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    /**
     * Format response for student context
     */
    formatResponse(response, context = {}) {
        let formatted = response;
        
        // Add code formatting enhancement
        formatted = formatted.replace(/```/g, '```');
        
        // Add study tips if applicable
        if (context.includeStudyTips) {
            formatted += '\n\n💡 **Study Tips:**\n- Break down complex concepts into smaller parts\n- Practice with real examples\n- Review and reinforce learning regularly';
        }
        
        return formatted;
    }
}

module.exports = StudentAgent;
