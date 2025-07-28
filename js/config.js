// Configuration for external APIs
export const CONFIG = {
    // Google Maps API configuration
    GOOGLE_MAPS: {
        // Set your Google Maps API key here
        // To get an API key, follow the setup instructions in GOOGLE_MAPS_SETUP.md
        API_KEY: '', // Leave empty to use mock routing
        
        // Google Maps API endpoints
        DIRECTIONS_API_URL: 'https://maps.googleapis.com/maps/api/directions/json',
        
        // Default routing options
        DEFAULT_OPTIONS: {
            avoid: 'tolls', // Can be: tolls, highways, ferries, indoor
            units: 'metric', // metric or imperial
            mode: 'driving', // driving, walking, bicycling, transit
            departure_time: 'now' // Use current time for traffic-aware routing
        }
    },
    
    // Backup routing service (OSRM - Open Source Routing Machine)
    OSRM: {
        API_URL: 'https://router.project-osrm.org/route/v1/driving',
        ENABLED: true // Enable OSRM as fallback when Google Maps API is not available
    },
    
    // Application settings
    APP: {
        // Default buffer time in minutes added to routes
        BUFFER_MINUTES: 5,
        
        // Maximum number of waypoints per route (Google Maps limit is 25)
        MAX_WAYPOINTS: 23, // Leave 2 for start and end
        
        // Default average speed for mock routing (km/h)
        MOCK_SPEED_KMH: 30
    }
};

// Utility functions for configuration
export class ConfigManager {
    static isGoogleMapsConfigured() {
        return CONFIG.GOOGLE_MAPS.API_KEY && CONFIG.GOOGLE_MAPS.API_KEY.trim().length > 0;
    }
    
    static setGoogleMapsApiKey(apiKey) {
        CONFIG.GOOGLE_MAPS.API_KEY = apiKey;
    }
    
    static getRoutingMode() {
        if (this.isGoogleMapsConfigured()) {
            return 'google_maps';
        } else if (CONFIG.OSRM.ENABLED) {
            return 'osrm';
        } else {
            return 'mock';
        }
    }
    
    static getRoutingDescription() {
        const mode = this.getRoutingMode();
        switch (mode) {
            case 'google_maps':
                return 'Google Maps Directions API (with live traffic)';
            case 'osrm':
                return 'OSRM Open Source Routing (real roads, no traffic)';
            case 'mock':
                return 'Mock routing (straight-line distances)';
            default:
                return 'Unknown routing mode';
        }
    }
}