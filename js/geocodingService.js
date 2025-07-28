// Mock geocoding service for demonstration (no external API calls)
export class GeocodingService {
    constructor() {
        // Mock coordinate database for common locations
        this.mockLocations = {
            'times square, new york, ny': { lat: 40.7580, lng: -73.9855, displayName: 'Times Square, New York, NY' },
            'central park, new york, ny': { lat: 40.7829, lng: -73.9654, displayName: 'Central Park, New York, NY' },
            'brooklyn bridge, new york, ny': { lat: 40.7061, lng: -73.9969, displayName: 'Brooklyn Bridge, New York, NY' },
            'empire state building, new york, ny': { lat: 40.7484, lng: -73.9857, displayName: 'Empire State Building, New York, NY' },
            'statue of liberty, new york, ny': { lat: 40.6892, lng: -74.0445, displayName: 'Statue of Liberty, New York, NY' },
            '123 main street, new york, ny': { lat: 40.7589, lng: -73.9851, displayName: '123 Main Street, New York, NY' },
            '456 broadway, new york, ny': { lat: 40.7505, lng: -73.9934, displayName: '456 Broadway, New York, NY' },
            '789 5th avenue, new york, ny': { lat: 40.7614, lng: -73.9776, displayName: '789 5th Avenue, New York, NY' },
            'jfk airport, new york, ny': { lat: 40.6413, lng: -73.7781, displayName: 'JFK Airport, New York, NY' },
            'laguardia airport, new york, ny': { lat: 40.7769, lng: -73.8740, displayName: 'LaGuardia Airport, New York, NY' },
            'grand central station, new york, ny': { lat: 40.7527, lng: -73.9772, displayName: 'Grand Central Terminal, New York, NY' },
            'wall street, new york, ny': { lat: 40.7074, lng: -74.0113, displayName: 'Wall Street, New York, NY' }
        };
        this.cache = new Map();
    }
    
    async geocodeAddress(address) {
        // Check cache first
        if (this.cache.has(address)) {
            return this.cache.get(address);
        }
        
        // Simulate API delay
        await this.delay(500);
        
        // Normalize address for lookup
        const normalizedAddress = address.toLowerCase().trim();
        
        // Try exact match first
        if (this.mockLocations[normalizedAddress]) {
            const result = this.mockLocations[normalizedAddress];
            this.cache.set(address, result);
            return result;
        }
        
        // Try partial matches
        const partialMatch = Object.keys(this.mockLocations).find(key => 
            key.includes(normalizedAddress) || normalizedAddress.includes(key)
        );
        
        if (partialMatch) {
            const result = this.mockLocations[partialMatch];
            this.cache.set(address, result);
            return result;
        }
        
        // Generate mock coordinates for unknown addresses
        // This simulates geocoding for any address in the NYC area
        const result = {
            lat: 40.7500 + (Math.random() - 0.5) * 0.1, // Random within NYC area
            lng: -73.9800 + (Math.random() - 0.5) * 0.1,
            displayName: address + ' (Mock Location)'
        };
        
        this.cache.set(address, result);
        return result;
    }
    
    async reverseGeocode(lat, lng) {
        // Simulate API delay
        await this.delay(300);
        
        return {
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)} (Mock Reverse Geocode)`,
            details: {
                city: 'New York',
                state: 'NY',
                country: 'USA'
            }
        };
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    clearCache() {
        this.cache.clear();
    }
}