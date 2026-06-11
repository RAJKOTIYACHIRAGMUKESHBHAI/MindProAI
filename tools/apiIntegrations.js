/**
 * API Integrations for AI Agent Packs
 * Handles all API calls for Student, Business, and Local packs
 */

const axios = require('axios');

// ==========================================
// STUDENT PACK APIs
// ==========================================

/**
 * Fetch GitHub repositories for educational content
 */
async function fetchGithubRepos(query, limit = 5) {
    try {
        const response = await axios.get('https://api.github.com/search/repositories', {
            params: {
                q: `${query} in:readme language:javascript OR language:python OR language:java`,
                sort: 'stars',
                order: 'desc',
                per_page: limit
            },
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        return response.data.items.map(repo => ({
            name: repo.name,
            url: repo.html_url,
            description: repo.description,
            stars: repo.stargazers_count,
            language: repo.language
        }));
    } catch (error) {
        console.error('GitHub API Error:', error.message);
        return [];
    }
}

/**
 * Fetch educational content from public APIs
 */
async function fetchEducationalContent(topic) {
    try {
        // Using Open Library API as alternative educational resource
        const response = await axios.get('https://openlibrary.org/search.json', {
            params: {
                q: topic,
                limit: 5,
                sort: 'rating'
            }
        });
        
        return response.data.docs.slice(0, 5).map(book => ({
            title: book.title,
            author: book.author_name ? book.author_name[0] : 'Unknown',
            year: book.first_publish_year,
            rating: book.rating_average || 'N/A'
        }));
    } catch (error) {
        console.error('Educational Content API Error:', error.message);
        return [];
    }
}

// ==========================================
// BUSINESS PACK APIs
// ==========================================

/**
 * Fetch stock data from Alpha Vantage
 */
async function fetchStockData(symbol) {
    try {
        const apiKey = process.env.ALPHA_VANTAGE_KEY;
        if (!apiKey) {
            console.warn('Alpha Vantage API key not configured');
            return null;
        }
        
        const response = await axios.get('https://www.alphavantage.co/query', {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol: symbol,
                apikey: apiKey
            }
        });
        
        const quote = response.data['Global Quote'];
        if (!quote || Object.keys(quote).length === 0) {
            return null;
        }
        
        return {
            symbol: quote['01. symbol'],
            price: quote['05. price'],
            change: quote['09. change'],
            changePercent: quote['10. change percent'],
            timestamp: quote['07. latest trading day']
        };
    } catch (error) {
        console.error('Alpha Vantage API Error:', error.message);
        return null;
    }
}

/**
 * Fetch business news
 */
async function fetchBusinessNews(keyword = 'business', limit = 5) {
    try {
        const newsApiKey = process.env.NEWSAPI_KEY;
        if (!newsApiKey) {
            console.warn('News API key not configured');
            return [];
        }
        
        const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
                q: keyword,
                sortBy: 'publishedAt',
                language: 'en',
                pageSize: limit,
                apiKey: newsApiKey
            }
        });
        
        return response.data.articles.map(article => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt
        }));
    } catch (error) {
        console.error('Business News API Error:', error.message);
        return [];
    }
}

// ==========================================
// LOCAL PACK APIs
// ==========================================

/**
 * Fetch weather information
 */
async function fetchWeather(location) {
    try {
        const weatherApiKey = process.env.WEATHERAPI_KEY || process.env.OPENWEATHER_KEY;
        if (!weatherApiKey) {
            console.warn('Weather API key not configured');
            return null;
        }
        
        // Using Open-Meteo (free, no API key needed)
        const encodedLocation = encodeURIComponent(location);
        const geoResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
            params: {
                name: location,
                count: 1
            }
        });
        
        if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
            return null;
        }
        
        const coords = geoResponse.data.results[0];
        const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: coords.latitude,
                longitude: coords.longitude,
                current: 'temperature_2m,weather_code,wind_speed_10m',
                timezone: 'auto'
            }
        });
        
        const current = weatherResponse.data.current;
        return {
            location: `${coords.name}, ${coords.country}`,
            temperature: current.temperature_2m,
            condition: getWeatherDescription(current.weather_code),
            windSpeed: current.wind_speed_10m,
            timezone: weatherResponse.data.timezone
        };
    } catch (error) {
        console.error('Weather API Error:', error.message);
        return null;
    }
}

/**
 * Convert weather code to description
 */
function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Foggy (rime)',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers'
    };
    return weatherCodes[code] || 'Unknown conditions';
}

/**
 * Fetch restaurants near location
 */
async function fetchNearbyRestaurants(location, cuisine = 'all') {
    try {
        // Using Nominatim API to get coordinates
        const geoResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: location,
                format: 'json',
                limit: 1
            }
        });
        
        if (!geoResponse.data || geoResponse.data.length === 0) {
            return [];
        }
        
        const coords = geoResponse.data[0];
        
        // Simulated restaurant data (in production, use Google Places API or similar)
        const mockRestaurants = [
            {
                name: 'Local Bistro Café',
                cuisine: 'Contemporary',
                rating: 4.5,
                distance: 0.2,
                address: '123 Main St'
            },
            {
                name: 'Street Food Hub',
                cuisine: 'Indian',
                rating: 4.3,
                distance: 0.5,
                address: '456 Food Lane'
            },
            {
                name: 'Fine Dining Express',
                cuisine: 'Italian',
                rating: 4.7,
                distance: 0.8,
                address: '789 Dining St'
            }
        ];
        
        return mockRestaurants;
    } catch (error) {
        console.error('Restaurant Finder API Error:', error.message);
        return [];
    }
}

/**
 * Fetch local events
 */
async function fetchLocalEvents(location, limit = 5) {
    try {
        // Simulated local events data
        const mockEvents = [
            {
                name: 'Community Market',
                date: 'This Saturday',
                time: '08:00 AM - 02:00 PM',
                location: 'Central Plaza',
                category: 'Shopping'
            },
            {
                name: 'Live Music Concert',
                date: 'Friday Evening',
                time: '07:00 PM',
                location: 'City Amphitheater',
                category: 'Entertainment'
            },
            {
                name: 'Tech Meetup',
                date: 'Next Thursday',
                time: '06:00 PM',
                location: 'Innovation Hub',
                category: 'Networking'
            },
            {
                name: 'Fitness Workshop',
                date: 'Tomorrow',
                time: '06:30 AM',
                location: 'Community Center',
                category: 'Sports'
            },
            {
                name: 'Art Exhibition Opening',
                date: 'Next Sunday',
                time: '05:00 PM',
                location: 'Art Museum',
                category: 'Culture'
            }
        ];
        
        return mockEvents.slice(0, limit);
    } catch (error) {
        console.error('Local Events API Error:', error.message);
        return [];
    }
}

/**
 * Get maps/directions information
 */
async function getMapsInfo(startLocation, endLocation) {
    try {
        // Using OpenStreetMap Nominatim for geocoding
        const startGeo = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: startLocation,
                format: 'json',
                limit: 1
            }
        });
        
        if (!startGeo.data || startGeo.data.length === 0) {
            return null;
        }
        
        const start = startGeo.data[0];
        
        return {
            startLocation: `${start.name}, ${start.address?.country || ''}`,
            latitude: start.lat,
            longitude: start.lon,
            mapsUrl: `https://www.openstreetmap.org/?mlat=${start.lat}&mlon=${start.lon}&zoom=15`,
            directions: `Get directions using your preferred maps app to ${endLocation}`
        };
    } catch (error) {
        console.error('Maps API Error:', error.message);
        return null;
    }
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Format API data for agent response
 */
function formatDataForAgent(agentType, data, dataType) {
    let formatted = '';
    
    switch(agentType) {
        case 'student':
            if (dataType === 'github') {
                formatted = data.map(repo => 
                    `📚 **${repo.name}**\n` +
                    `   Description: ${repo.description || 'N/A'}\n` +
                    `   Language: ${repo.language || 'N/A'}\n` +
                    `   Stars: ⭐ ${repo.stars}\n` +
                    `   URL: ${repo.url}`
                ).join('\n\n');
            }
            break;
            
        case 'business':
            if (dataType === 'stock') {
                formatted = `📈 **${data.symbol}**\n` +
                    `   Price: $${data.price}\n` +
                    `   Change: ${data.change} (${data.changePercent})\n` +
                    `   Last Update: ${data.timestamp}`;
            } else if (dataType === 'news') {
                formatted = data.map(article =>
                    `📰 **${article.title}**\n` +
                    `   Source: ${article.source}\n` +
                    `   ${article.description}\n` +
                    `   [Read More](${article.url})`
                ).join('\n\n');
            }
            break;
            
        case 'local':
            if (dataType === 'weather') {
                formatted = `🌤️ **Weather in ${data.location}**\n` +
                    `   Temperature: ${data.temperature}°C\n` +
                    `   Condition: ${data.condition}\n` +
                    `   Wind Speed: ${data.windSpeed} km/h`;
            } else if (dataType === 'restaurants') {
                formatted = data.map(restaurant =>
                    `🍽️ **${restaurant.name}**\n` +
                    `   Cuisine: ${restaurant.cuisine}\n` +
                    `   Rating: ⭐ ${restaurant.rating}\n` +
                    `   Distance: ${restaurant.distance}km`
                ).join('\n\n');
            }
            break;
    }
    
    return formatted;
}

module.exports = {
    // Student APIs
    fetchGithubRepos,
    fetchEducationalContent,
    
    // Business APIs
    fetchStockData,
    fetchBusinessNews,
    
    // Local APIs
    fetchWeather,
    fetchNearbyRestaurants,
    fetchLocalEvents,
    getMapsInfo,
    
    // Utilities
    formatDataForAgent,
    getWeatherDescription
};
