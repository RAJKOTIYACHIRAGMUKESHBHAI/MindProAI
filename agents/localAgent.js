/**
 * Local Pack Agent
 * Specialized for local services, weather, restaurants, events, and navigation
 */

const { fetchWeather, fetchNearbyRestaurants, fetchLocalEvents, getMapsInfo } = require('../tools/apiIntegrations');
const { getSystemPrompt } = require('./agentConfig');

class LocalAgent {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.type = 'local';
        this.name = '📍 Local Pack';
    }

    /**
     * Get system prompt for local agent
     */
    getSystemPrompt() {
        return getSystemPrompt(this.type);
    }

    /**
     * Process query with local-specific logic
     */
    async processQuery(query, context = {}) {
        let enrichedContext = '';
        const userLocation = context.userLocation || 'Current Location';
        
        // Check if query asks about weather
        if (this.containsKeyword(query, ['weather', 'rain', 'snow', 'temperature', 'forecast', 'climate', 'wind', 'cloudy', 'sunny'])) {
            try {
                const location = this.extractLocation(query) || userLocation;
                const weather = await fetchWeather(location);
                if (weather) {
                    enrichedContext += '\n🌤️ **Weather Information:**\n';
                    enrichedContext += `- Location: ${weather.location}\n`;
                    enrichedContext += `- Temperature: ${weather.temperature}°C\n`;
                    enrichedContext += `- Condition: ${weather.condition}\n`;
                    enrichedContext += `- Wind Speed: ${weather.windSpeed} km/h\n`;
                    enrichedContext += `- Timezone: ${weather.timezone}`;
                }
            } catch (error) {
                console.error('Local Agent - Weather fetch error:', error.message);
            }
        }

        // Check if query asks about restaurants/food
        if (this.containsKeyword(query, ['restaurant', 'food', 'eat', 'dining', 'cafe', 'pizza', 'burger', 'pizza', 'cuisine', 'meal'])) {
            try {
                const location = this.extractLocation(query) || userLocation;
                const restaurants = await fetchNearbyRestaurants(location);
                if (restaurants.length > 0) {
                    enrichedContext += '\n🍽️ **Nearby Restaurants:**\n';
                    enrichedContext += restaurants.map(r =>
                        `- **${r.name}** (${r.cuisine})\n  ⭐ ${r.rating} | ${r.distance}km away`
                    ).join('\n');
                }
            } catch (error) {
                console.error('Local Agent - Restaurant fetch error:', error.message);
            }
        }

        // Check if query asks about events/activities
        if (this.containsKeyword(query, ['event', 'activity', 'entertainment', 'concert', 'market', 'festival', 'show', 'party', 'happening'])) {
            try {
                const location = this.extractLocation(query) || userLocation;
                const events = await fetchLocalEvents(location, 5);
                if (events.length > 0) {
                    enrichedContext += '\n🎉 **Local Events:**\n';
                    enrichedContext += events.map(e =>
                        `- **${e.name}**\n  📅 ${e.date} at ${e.time}\n  📍 ${e.location}`
                    ).join('\n\n');
                }
            } catch (error) {
                console.error('Local Agent - Events fetch error:', error.message);
            }
        }

        // Check if query asks for directions/navigation
        if (this.containsKeyword(query, ['direction', 'navigate', 'route', 'map', 'where', 'how to get', 'distance', 'location'])) {
            try {
                const locations = this.extractLocations(query);
                if (locations.length >= 1) {
                    const startLoc = locations[0];
                    const endLoc = locations[1] || 'nearby destination';
                    const mapInfo = await getMapsInfo(startLoc, endLoc);
                    if (mapInfo) {
                        enrichedContext += '\n🗺️ **Navigation:**\n';
                        enrichedContext += `- Location: ${mapInfo.startLocation}\n`;
                        enrichedContext += `- [Open in Maps](${mapInfo.mapsUrl})\n`;
                        enrichedContext += `- ${mapInfo.directions}`;
                    }
                }
            } catch (error) {
                console.error('Local Agent - Maps fetch error:', error.message);
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
     * Get local agent capabilities
     */
    getCapabilities() {
        return [
            'Real-time weather forecasts',
            'Restaurant recommendations',
            'Local event discovery',
            'Navigation and directions',
            'Local business information',
            'Service recommendations',
            'Location-based suggestions',
            'Event planning assistance'
        ];
    }

    /**
     * Extract location from query
     */
    extractLocation(text) {
        // Simple location extraction - looks for proper nouns or city names
        // In production, use NLP library like compromise or NLTK
        const words = text.split(' ');
        const capitalizedWords = words.filter(w => /^[A-Z]/.test(w) && w.length > 2);
        return capitalizedWords.join(' ') || null;
    }

    /**
     * Extract multiple locations from query
     */
    extractLocations(text) {
        const words = text.split(' ');
        const capitalizedWords = words.filter(w => /^[A-Z]/.test(w) && w.length > 2);
        return capitalizedWords.slice(0, 3);
    }

    /**
     * Check if query contains relevant keywords
     */
    containsKeyword(text, keywords) {
        const lowerText = text.toLowerCase();
        return keywords.some(keyword => lowerText.includes(keyword));
    }

    /**
     * Format response for local context
     */
    formatResponse(response, context = {}) {
        let formatted = response;
        
        // Add location-based suggestions
        if (context.userLocation) {
            formatted += `\n\n📌 *Based on your location: ${context.userLocation}*`;
        }
        
        // Add practical tips
        if (context.includeTips) {
            formatted += '\n\n💡 **Local Travel Tips:**\n- Check weather before outdoor activities\n- Book restaurants in advance during peak hours\n- Use public transportation where available\n- Always have local emergency contacts';
        }
        
        return formatted;
    }
}

module.exports = LocalAgent;
