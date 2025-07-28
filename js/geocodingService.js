// Geocoding service with real API integration and mock fallback
export class GeocodingService {
    constructor() {
        // Mock coordinate database for common locations (fallback)
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
        this.lastRequestTime = 0;
        this.useRealGeocoding = true; // Set to false to use only mock data
    }
    
    async geocodeAddress(address) {
        // Check cache first
        if (this.cache.has(address)) {
            return this.cache.get(address);
        }
        
        let result = null;
        
        // Try real geocoding first if enabled
        if (this.useRealGeocoding) {
            try {
                result = await this.geocodeWithNominatim(address);
                if (result) {
                    this.cache.set(address, result);
                    return result;
                }
            } catch (error) {
                console.warn('Real geocoding failed, falling back to mock:', error.message);
            }
        }
        
        // Fall back to mock geocoding
        result = await this.geocodeWithMock(address);
        this.cache.set(address, result);
        return result;
    }
    
    /**
     * Geocode using Nominatim API (OpenStreetMap)
     */
    async geocodeWithNominatim(address) {
        // Respect rate limiting (1 request per second)
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < 1000) {
            await this.delay(1000 - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();
        
        const url = 'https://nominatim.openstreetmap.org/search';
        const params = new URLSearchParams({
            q: address,
            format: 'json',
            limit: '1',
            addressdetails: '1'
        });
        
        const response = await fetch(`${url}?${params}`, {
            headers: {
                'User-Agent': 'Driving-assignments-app/1.0' // Required by Nominatim
            }
        });
        
        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const location = data[0];
            return {
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lon),
                displayName: location.display_name
            };
        }
        
        return null; // No results found
    }
    
    /**
     * Fallback geocoding using mock data
     */
    async geocodeWithMock(address) {
        // Simulate API delay
        await this.delay(500);
        
        // Normalize address for lookup
        const normalizedAddress = address.toLowerCase().trim();
        
        // Try exact match first
        if (this.mockLocations[normalizedAddress]) {
            const result = this.mockLocations[normalizedAddress];
            return result;
        }
        
        // Try partial matches
        const partialMatch = Object.keys(this.mockLocations).find(key => 
            key.includes(normalizedAddress) || normalizedAddress.includes(key)
        );
        
        if (partialMatch) {
            const result = this.mockLocations[partialMatch];
            return result;
        }
        
        // Return null for unknown addresses instead of generating random coordinates
        // This will cause the application to show an error rather than misleading information
        throw new Error(`Address "${address}" could not be geocoded. Please check the address or try a more specific location.`);
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
    
    /**
     * Toggle between real and mock geocoding
     */
    setUseRealGeocoding(useReal) {
        this.useRealGeocoding = useReal;
        console.log(`Geocoding mode: ${useReal ? 'Real API' : 'Mock only'}`);
    }
    
    /**
     * Get current geocoding mode
     */
    isUsingRealGeocoding() {
        return this.useRealGeocoding;
    }
}