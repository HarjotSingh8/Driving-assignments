// Geocoding service with real API integration and mock fallback
export class GeocodingService {
    constructor() {
        // Google Plus Code (Open Location Code) configuration
        this.plusCodeConfig = {
            // Character set used in Plus Codes (excludes 0, 1, A, E, I, L, O, S, U, Z)
            alphabet: '23456789CFGHJMPQRVWX',
            // Base for encoding (20 characters)
            base: 20,
            // Grid dimensions
            latitudeMax: 90,
            longitudeMax: 180,
            // Code lengths
            pairCodeLength: 8,
            gridCodeLength: 2,
            // Precision levels
            pairPrecisions: [20.0, 1.0, 0.05, 0.0025, 0.000125],
            gridRows: 5,
            gridCols: 4
        };
        
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
            'wall street, new york, ny': { lat: 40.7074, lng: -74.0113, displayName: 'Wall Street, New York, NY' },
            // Google Plus Code examples for testing
            '8w3c+95 windsor, ontario': { lat: 42.3042, lng: -83.0642, displayName: 'Windsor, Ontario (Plus Code: 8W3C+95)' },
            '87g2+22 toronto, ontario': { lat: 43.6755, lng: -79.4990, displayName: 'Toronto, Ontario (Plus Code: 87G2+22)' },
            '9g8f+6w new york, ny': { lat: 40.7666, lng: -73.9754, displayName: 'New York, NY (Plus Code: 9G8F+6W)' }
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
        
        // Check if the address contains a Google Plus Code first
        const plusCodeResult = this.detectAndDecodePlusCode(address);
        if (plusCodeResult) {
            this.cache.set(address, plusCodeResult);
            return plusCodeResult;
        }
        
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
     * Detect and decode Google Plus Codes (Open Location Codes) in an address
     */
    detectAndDecodePlusCode(address) {
        // Regular expression to match Plus Codes
        // Matches patterns like "8W3C+95", "9G8F+6W", "8FVC9G8F+6W" etc.
        const plusCodeRegex = /([23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3})/i;
        const match = address.match(plusCodeRegex);
        
        if (!match) {
            return null;
        }
        
        const plusCode = match[1].toUpperCase();
        const locality = address.replace(plusCodeRegex, '').trim().replace(/^,\s*/, '').replace(/\s*,$/, '');
        
        try {
            const decoded = this.decodePlusCode(plusCode, locality);
            return {
                lat: decoded.lat,
                lng: decoded.lng,
                displayName: locality ? `${locality} (Plus Code: ${plusCode})` : `Plus Code: ${plusCode}`
            };
        } catch (error) {
            console.warn(`Failed to decode Plus Code ${plusCode}:`, error.message);
            return null;
        }
    }
    
    /**
     * Decode a Google Plus Code to latitude and longitude
     */
    decodePlusCode(code, locality = null) {
        // Remove any spaces and convert to uppercase
        code = code.replace(/\s/g, '').toUpperCase();
        
        // Validate Plus Code format
        if (!code.includes('+')) {
            throw new Error('Invalid Plus Code: must contain a + character');
        }
        
        const parts = code.split('+');
        if (parts.length !== 2) {
            throw new Error('Invalid Plus Code: must have exactly one + character');
        }
        
        const [prefix, suffix] = parts;
        
        // Validate character set
        const validChars = this.plusCodeConfig.alphabet;
        for (const char of code.replace('+', '')) {
            if (!validChars.includes(char)) {
                throw new Error(`Invalid Plus Code character: ${char}`);
            }
        }
        
        // Handle short codes (need locality context)
        if (prefix.length < this.plusCodeConfig.pairCodeLength) {
            if (!locality) {
                throw new Error('Short Plus Code requires locality context');
            }
            // For simplicity, we'll use approximate center coordinates for common areas
            const localityCenter = this.getLocalityCenter(locality);
            return this.decodeShortPlusCode(code, localityCenter);
        }
        
        // Decode full Plus Code
        return this.decodeFullPlusCode(prefix, suffix);
    }
    
    /**
     * Decode a full Plus Code (8+ characters before +)
     */
    decodeFullPlusCode(prefix, suffix) {
        const { alphabet, base, latitudeMax, longitudeMax, pairPrecisions } = this.plusCodeConfig;
        
        // Initialize coordinates
        let lat = -latitudeMax;
        let lng = -longitudeMax;
        
        // Decode pairs (each pair represents one level of precision)
        for (let i = 0; i < prefix.length; i += 2) {
            if (i + 1 >= prefix.length) break;
            
            const latChar = prefix[i];
            const lngChar = prefix[i + 1];
            
            const latIndex = alphabet.indexOf(latChar);
            const lngIndex = alphabet.indexOf(lngChar);
            
            if (latIndex === -1 || lngIndex === -1) {
                throw new Error(`Invalid Plus Code characters: ${latChar}${lngChar}`);
            }
            
            const precision = pairPrecisions[Math.floor(i / 2)] || pairPrecisions[pairPrecisions.length - 1];
            
            lat += latIndex * precision;
            lng += lngIndex * precision;
        }
        
        // Decode grid refinement if present in suffix
        if (suffix.length > 0) {
            const gridChar = suffix[0];
            const gridIndex = alphabet.indexOf(gridChar);
            
            if (gridIndex !== -1) {
                const { gridRows, gridCols } = this.plusCodeConfig;
                const gridLatIndex = Math.floor(gridIndex / gridCols);
                const gridLngIndex = gridIndex % gridCols;
                
                const gridPrecision = pairPrecisions[pairPrecisions.length - 1] / gridRows;
                
                lat += gridLatIndex * gridPrecision;
                lng += gridLngIndex * gridPrecision;
            }
        }
        
        // Add half the precision to get center of the cell
        const finalPrecision = suffix.length > 0 ? 
            pairPrecisions[pairPrecisions.length - 1] / this.plusCodeConfig.gridRows :
            pairPrecisions[Math.min(Math.floor(prefix.length / 2) - 1, pairPrecisions.length - 1)] || pairPrecisions[pairPrecisions.length - 1];
        
        lat += finalPrecision / 2;
        lng += finalPrecision / 2;
        
        return { lat, lng };
    }
    
    /**
     * Decode a short Plus Code using locality context
     */
    decodeShortPlusCode(code, localityCenter) {
        // This is a simplified implementation for short codes
        // In practice, you'd need more sophisticated reference point calculation
        try {
            // For short codes, we'll estimate coordinates based on locality and code
            const parts = code.split('+');
            const prefix = parts[0];
            const suffix = parts[1];
            
            // Use locality center as base and add offset based on short code
            const { alphabet } = this.plusCodeConfig;
            
            let latOffset = 0;
            let lngOffset = 0;
            
            // Decode the short prefix
            for (let i = 0; i < prefix.length; i += 2) {
                if (i + 1 >= prefix.length) break;
                
                const latChar = prefix[i];
                const lngChar = prefix[i + 1];
                
                const latIndex = alphabet.indexOf(latChar);
                const lngIndex = alphabet.indexOf(lngChar);
                
                if (latIndex !== -1 && lngIndex !== -1) {
                    // Add fine-grained offset
                    latOffset += latIndex * 0.0025;
                    lngOffset += lngIndex * 0.0025;
                }
            }
            
            // Add grid refinement from suffix
            if (suffix.length > 0) {
                const gridChar = suffix[0];
                const gridIndex = alphabet.indexOf(gridChar);
                
                if (gridIndex !== -1) {
                    const gridLatIndex = Math.floor(gridIndex / 4);
                    const gridLngIndex = gridIndex % 4;
                    
                    latOffset += gridLatIndex * 0.000125;
                    lngOffset += gridLngIndex * 0.000125;
                }
            }
            
            return {
                lat: localityCenter.lat + latOffset,
                lng: localityCenter.lng + lngOffset
            };
        } catch (error) {
            throw new Error(`Could not decode short Plus Code ${code} with locality context`);
        }
    }
    
    /**
     * Get approximate center coordinates for common localities
     */
    getLocalityCenter(locality) {
        // Normalize locality string
        const normalized = locality.toLowerCase().trim();
        
        // Common locality centers (this would be more comprehensive in production)
        const localityCenters = {
            'windsor, ontario': { lat: 42.3149, lng: -83.0364 },
            'windsor': { lat: 42.3149, lng: -83.0364 },
            'toronto, ontario': { lat: 43.6532, lng: -79.3832 },
            'toronto': { lat: 43.6532, lng: -79.3832 },
            'new york, ny': { lat: 40.7128, lng: -74.0060 },
            'new york': { lat: 40.7128, lng: -74.0060 },
            'ontario': { lat: 44.2619, lng: -78.2957 },
            'ny': { lat: 43.2994, lng: -74.2179 }
        };
        
        return localityCenters[normalized] || { lat: 0, lng: 0 };
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