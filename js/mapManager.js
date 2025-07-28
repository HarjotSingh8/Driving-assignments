// Simple map implementation without external dependencies
export class MapManager {
    constructor() {
        this.mapContainer = null;
        this.routes = [];
        this.data = null;
        this.colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];
    }
    
    initializeMap() {
        this.mapContainer = document.getElementById('map');
        if (!this.mapContainer) return;
        
        // Create a simple text-based map display
        this.mapContainer.innerHTML = `
            <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                <h3>Route Visualization</h3>
                <p>Map would be displayed here with Leaflet integration</p>
                <div id="mapContent"></div>
            </div>
        `;
    }
    
    displayRoutes(routes, data) {
        this.routes = routes;
        this.data = data;
        
        if (!this.mapContainer) {
            this.initializeMap();
        }
        
        const mapContent = document.getElementById('mapContent');
        if (!mapContent) return;
        
        let html = '';
        
        // Display destination info
        if (data.destination) {
            html += `
                <div style="background: white; margin: 10px 0; padding: 15px; border-radius: 4px; border-left: 4px solid #FF0000;">
                    <strong>🎯 Destination:</strong> ${this.escapeHtml(data.destination.address)}<br>
                    <small>Coordinates: ${data.destination.coordinates.lat.toFixed(6)}, ${data.destination.coordinates.lng.toFixed(6)}</small><br>
                    <small>Arrival Time: ${new Date(data.destination.arrivalTime).toLocaleString()}</small>
                </div>
            `;
        }
        
        // Display each route
        routes.forEach((route, index) => {
            const color = this.colors[index % this.colors.length];
            const driver = data.drivers.find(d => d.id === route.driverId);
            
            html += `
                <div style="background: white; margin: 10px 0; padding: 15px; border-radius: 4px; border-left: 4px solid ${color};">
                    <strong>🚗 ${this.escapeHtml(route.driverName)}</strong><br>
                    <small>Start: ${this.escapeHtml(driver?.address || 'Unknown')}</small><br>
                    <small>Coordinates: ${driver?.coordinates.lat.toFixed(6)}, ${driver?.coordinates.lng.toFixed(6)}</small><br>
                    <small>Departure: ${route.pickupTimes?.formattedDepartureTime || 'N/A'}</small><br>
                    
                    ${route.pickups.length > 0 ? `
                        <div style="margin-top: 10px;">
                            <strong>Pickups:</strong><br>
                            ${route.pickups.map((pickup, pickupIndex) => {
                                const pickupTime = route.pickupTimes?.pickupTimes?.[pickupIndex];
                                return `
                                    <div style="margin-left: 20px; padding: 5px 0;">
                                        📍 ${this.escapeHtml(pickup.name)} - ${this.escapeHtml(pickup.address)}<br>
                                        <small>Coordinates: ${pickup.coordinates.lat.toFixed(6)}, ${pickup.coordinates.lng.toFixed(6)}</small><br>
                                        <small>Pickup Time: ${pickupTime?.formattedTime || 'N/A'}</small>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : '<small>No pickups assigned</small>'}
                    
                    <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                        Distance: ${this.formatDistance(route.totalDistance)} | 
                        Duration: ${this.formatDuration(route.totalDuration)}
                    </div>
                </div>
            `;
        });
        
        mapContent.innerHTML = html;
    }
    
    formatDuration(seconds) {
        if (!seconds) return 'N/A';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
    
    formatDistance(meters) {
        if (!meters) return 'N/A';
        
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    destroy() {
        if (this.mapContainer) {
            this.mapContainer.innerHTML = '';
        }
    }
}