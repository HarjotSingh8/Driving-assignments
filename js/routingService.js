// Mock routing service for demonstration (no external API calls)
export class RoutingService {
    constructor() {
        // Mock routing that calculates basic routes
    }
    
    async calculateRoute(coordinates) {
        // Simulate API delay
        await this.delay(800);
        
        // Calculate basic route info
        let totalDistance = 0;
        let totalDuration = 0;
        const legs = [];
        
        for (let i = 0; i < coordinates.length - 1; i++) {
            const start = coordinates[i];
            const end = coordinates[i + 1];
            
            // Calculate distance using Haversine formula
            const distance = this.calculateDistance(
                { lat: start[1], lng: start[0] },
                { lat: end[1], lng: end[0] }
            ) * 1000; // Convert to meters
            
            // Estimate duration (assuming average speed of 30 km/h in city)
            const duration = (distance / 1000) * (3600 / 30); // seconds
            
            totalDistance += distance;
            totalDuration += duration;
            
            legs.push({
                duration,
                distance,
                steps: [{
                    instruction: `Drive from ${start[1].toFixed(4)}, ${start[0].toFixed(4)} to ${end[1].toFixed(4)}, ${end[0].toFixed(4)}`,
                    duration,
                    distance
                }]
            });
        }
        
        // Create simple geometry (straight lines between points)
        const geometry = {
            type: "LineString",
            coordinates: coordinates
        };
        
        return {
            duration: totalDuration,
            distance: totalDistance,
            geometry,
            legs
        };
    }
    
    async calculateAllRoutes(data, assignments) {
        const { destination, drivers } = data;
        const arrivalTime = new Date(destination.arrivalTime);
        const results = [];
        
        for (const driver of drivers) {
            const assignedPickups = assignments[driver.id] || [];
            const pickups = data.pickups.filter(pickup => assignedPickups.includes(pickup.id));
            
            if (pickups.length === 0) {
                // Driver with no pickups - just goes to destination
                const route = await this.calculateDriverRoute(driver, [], destination);
                results.push({
                    driverId: driver.id,
                    driverName: driver.name,
                    pickups: [],
                    route,
                    pickupTimes: {
                        departureTime: this.calculateDepartureTime(arrivalTime, route.duration),
                        pickupTimes: [],
                        formattedDepartureTime: this.formatTime(this.calculateDepartureTime(arrivalTime, route.duration))
                    },
                    totalDuration: route.duration,
                    totalDistance: route.distance
                });
                continue;
            }
            
            // Find optimal order for pickups (simple nearest neighbor for now)
            const orderedPickups = this.optimizePickupOrder(driver, pickups, destination);
            
            // Calculate route through all stops
            const route = await this.calculateDriverRoute(driver, orderedPickups, destination);
            
            // Calculate pickup times working backwards from arrival time
            const pickupTimes = this.calculatePickupTimes(arrivalTime, route, orderedPickups);
            
            results.push({
                driverId: driver.id,
                driverName: driver.name,
                pickups: orderedPickups,
                route,
                pickupTimes,
                totalDuration: route.duration,
                totalDistance: route.distance
            });
        }
        
        return results;
    }
    
    async calculateDriverRoute(driver, pickups, destination) {
        // Build coordinate sequence: driver -> pickups (in order) -> destination
        const coordinates = [
            [driver.coordinates.lng, driver.coordinates.lat]
        ];
        
        pickups.forEach(pickup => {
            coordinates.push([pickup.coordinates.lng, pickup.coordinates.lat]);
        });
        
        coordinates.push([destination.coordinates.lng, destination.coordinates.lat]);
        
        return await this.calculateRoute(coordinates);
    }
    
    optimizePickupOrder(driver, pickups, destination) {
        // Simple nearest neighbor algorithm
        if (pickups.length <= 1) return pickups;
        
        const ordered = [];
        const remaining = [...pickups];
        let current = driver.coordinates;
        
        while (remaining.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = this.calculateDistance(current, remaining[0].coordinates);
            
            for (let i = 1; i < remaining.length; i++) {
                const distance = this.calculateDistance(current, remaining[i].coordinates);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }
            
            const nearest = remaining.splice(nearestIndex, 1)[0];
            ordered.push(nearest);
            current = nearest.coordinates;
        }
        
        return ordered;
    }
    
    calculateDistance(coord1, coord2) {
        // Haversine formula for distance between two points
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(coord2.lat - coord1.lat);
        const dLng = this.toRadians(coord2.lng - coord1.lng);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    calculatePickupTimes(arrivalTime, route, pickups) {
        // Add 5-minute buffer
        const bufferMinutes = 5;
        const targetArrival = new Date(arrivalTime.getTime() - bufferMinutes * 60 * 1000);
        
        const pickupTimes = [];
        let currentTime = targetArrival;
        
        // Work backwards through the route legs
        const legs = route.legs.slice().reverse();
        
        // Last leg is to destination
        if (legs.length > 0) {
            currentTime = new Date(currentTime.getTime() - legs[0].duration * 1000);
        }
        
        // Calculate pickup times for each stop (working backwards)
        for (let i = 1; i < legs.length; i++) {
            const pickupIndex = pickups.length - i;
            if (pickupIndex >= 0) {
                pickupTimes.unshift({
                    pickup: pickups[pickupIndex],
                    arrivalTime: new Date(currentTime),
                    formattedTime: this.formatTime(currentTime)
                });
                
                // Subtract travel time to previous stop
                if (i < legs.length - 1) {
                    currentTime = new Date(currentTime.getTime() - legs[i].duration * 1000);
                }
            }
        }
        
        // Departure time is after the last leg duration
        const departureTime = new Date(currentTime.getTime() - (legs[legs.length - 1]?.duration || 0) * 1000);
        
        return {
            departureTime,
            pickupTimes,
            formattedDepartureTime: this.formatTime(departureTime)
        };
    }
    
    calculateDepartureTime(arrivalTime, totalDuration) {
        const bufferMinutes = 5;
        const targetArrival = new Date(arrivalTime.getTime() - bufferMinutes * 60 * 1000);
        return new Date(targetArrival.getTime() - totalDuration * 1000);
    }
    
    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
    
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}