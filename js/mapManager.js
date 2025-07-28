// Enhanced map implementation with Leaflet fallback
export class MapManager {
    constructor() {
        this.map = null;
        this.mapContainer = null;
        this.routes = [];
        this.data = null;
        this.colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'];
        this.markers = [];
        this.routeLines = [];
        this.leafletAvailable = false;
    }
    
    initializeMap() {
        this.mapContainer = document.getElementById('map');
        if (!this.mapContainer) return;
        
        // Check if Leaflet is available
        this.leafletAvailable = typeof L !== 'undefined';
        
        if (this.leafletAvailable) {
            this.initializeLeafletMap();
        } else {
            this.initializeFallbackMap();
        }
    }
    
    initializeLeafletMap() {
        // Clear any existing map
        if (this.map) {
            this.map.remove();
        }
        
        // Initialize Leaflet map
        this.map = L.map('map').setView([40.7589, -73.9851], 12); // Default to NYC
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        // Add a simple information panel
        const info = L.control({position: 'topright'});
        info.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'map-info');
            div.innerHTML = `
                <h4>🗺️ Route Map</h4>
                <div id="mapLegend">
                    <small>Routes will appear here after calculation</small>
                </div>
            `;
            div.style.background = 'white';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            return div;
        };
        info.addTo(this.map);
    }
    
    initializeFallbackMap() {
        // Enhanced fallback map with visual route representation
        this.mapContainer.innerHTML = `
            <div style="height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; overflow-y: auto;">
                <h3 style="margin-top: 0; text-align: center;">🗺️ Route Visualization</h3>
                <p style="text-align: center; margin-bottom: 20px; opacity: 0.9;">
                    Interactive map visualization with driver routes and pickup locations
                </p>
                <div id="mapContent" style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px;"></div>
                <div id="mapLegend" style="margin-top: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; padding: 10px;">
                    <small>Routes will appear here after calculation</small>
                </div>
            </div>
        `;
    }
    
    displayRoutes(routes, data) {
        this.routes = routes;
        this.data = data;
        
        if (!this.map && !this.mapContainer) {
            this.initializeMap();
        }
        
        if (this.leafletAvailable) {
            this.displayLeafletRoutes(routes, data);
        } else {
            this.displayFallbackRoutes(routes, data);
        }
    }
    
    displayLeafletRoutes(routes, data) {
        // Clear existing markers and routes
        this.clearMap();
        
        const allCoordinates = [];
        
        // Add destination marker
        if (data.destination && data.destination.coordinates) {
            const destMarker = L.marker([data.destination.coordinates.lat, data.destination.coordinates.lng])
                .addTo(this.map)
                .bindPopup(`
                    <b>🎯 Destination</b><br>
                    ${this.escapeHtml(data.destination.address)}<br>
                    <small>Arrival: ${new Date(data.destination.arrivalTime).toLocaleString()}</small>
                `);
            
            // Custom destination icon
            const destIcon = L.divIcon({
                html: '🎯',
                className: 'custom-marker destination-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            destMarker.setIcon(destIcon);
            
            this.markers.push(destMarker);
            allCoordinates.push([data.destination.coordinates.lat, data.destination.coordinates.lng]);
        }
        
        // Process each driver's route
        routes.forEach((route, index) => {
            const color = this.colors[index % this.colors.length];
            const driver = data.drivers.find(d => d.id === route.driverId);
            
            if (!driver) return;
            
            // Add driver starting marker
            const driverMarker = L.marker([driver.coordinates.lat, driver.coordinates.lng])
                .addTo(this.map)
                .bindPopup(`
                    <b>🚗 ${this.escapeHtml(route.driverName)}</b><br>
                    Start: ${this.escapeHtml(driver.address)}<br>
                    <small>Departure: ${route.pickupTimes?.formattedDepartureTime || 'N/A'}</small><br>
                    <small>Pickups: ${route.pickups.length}</small>
                `);
            
            // Custom driver icon
            const driverIcon = L.divIcon({
                html: '🚗',
                className: 'custom-marker driver-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            driverMarker.setIcon(driverIcon);
            
            this.markers.push(driverMarker);
            allCoordinates.push([driver.coordinates.lat, driver.coordinates.lng]);
            
            // Add pickup markers and route lines
            if (route.pickups.length > 0) {
                route.pickups.forEach((pickup, pickupIndex) => {
                    // Add pickup marker
                    const pickupTime = route.pickupTimes?.pickupTimes?.[pickupIndex];
                    const pickupMarker = L.marker([pickup.coordinates.lat, pickup.coordinates.lng])
                        .addTo(this.map)
                        .bindPopup(`
                            <b>📍 ${this.escapeHtml(pickup.name)}</b><br>
                            ${this.escapeHtml(pickup.address)}<br>
                            <small>Driver: ${this.escapeHtml(route.driverName)}</small><br>
                            <small>Pickup: ${pickupTime?.formattedTime || 'N/A'}</small>
                        `);
                    
                    // Custom pickup icon with driver color
                    const pickupIcon = L.divIcon({
                        html: '📍',
                        className: 'custom-marker pickup-marker',
                        iconSize: [25, 25],
                        iconAnchor: [12, 12]
                    });
                    pickupMarker.setIcon(pickupIcon);
                    
                    this.markers.push(pickupMarker);
                    allCoordinates.push([pickup.coordinates.lat, pickup.coordinates.lng]);
                });
                
                // Draw actual route path using geometry from routing service
                this.drawRouteGeometry(route.route, color, route.driverName, route.totalDistance, route.totalDuration, route.pickups.length);
            } else {
                // Driver with no pickups - draw direct route using actual geometry
                this.drawRouteGeometry(route.route, color, route.driverName, route.totalDistance, route.totalDuration, 0);
            }
        });
        
        // Update legend
        this.updateLeafletLegend(routes);
        
        // Fit map to show all markers
        if (allCoordinates.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }
    
    displayFallbackRoutes(routes, data) {
        const mapContent = document.getElementById('mapContent');
        if (!mapContent) return;
        
        let html = '';
        
        // Display destination info
        if (data.destination) {
            html += `
                <div style="background: rgba(255,255,255,0.9); color: #333; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #FF0000;">
                    <strong>🎯 Destination:</strong> ${this.escapeHtml(data.destination.address)}<br>
                    <small>📍 ${data.destination.coordinates.lat.toFixed(6)}, ${data.destination.coordinates.lng.toFixed(6)}</small><br>
                    <small>⏰ Arrival: ${new Date(data.destination.arrivalTime).toLocaleString()}</small>
                </div>
            `;
        }
        
        // Display each route
        routes.forEach((route, index) => {
            const color = this.colors[index % this.colors.length];
            const driver = data.drivers.find(d => d.id === route.driverId);
            
            html += `
                <div style="background: rgba(255,255,255,0.9); color: #333; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid ${color};">
                    <strong>🚗 ${this.escapeHtml(route.driverName)}</strong><br>
                    <small>🏠 Start: ${this.escapeHtml(driver?.address || 'Unknown')}</small><br>
                    <small>📍 ${driver?.coordinates.lat.toFixed(6)}, ${driver?.coordinates.lng.toFixed(6)}</small><br>
                    <small>🕐 Departure: ${route.pickupTimes?.formattedDepartureTime || 'N/A'}</small><br>
                    
                    ${route.pickups.length > 0 ? `
                        <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 4px;">
                            <strong>📍 Pickup Route:</strong><br>
                            ${route.pickups.map((pickup, pickupIndex) => {
                                const pickupTime = route.pickupTimes?.pickupTimes?.[pickupIndex];
                                return `
                                    <div style="margin: 8px 0; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid ${color};">
                                        <strong>${pickupIndex + 1}. ${this.escapeHtml(pickup.name)}</strong><br>
                                        <small>📍 ${this.escapeHtml(pickup.address)}</small><br>
                                        <small>🗺️ ${pickup.coordinates.lat.toFixed(6)}, ${pickup.coordinates.lng.toFixed(6)}</small><br>
                                        <small>⏰ Pickup: ${pickupTime?.formattedTime || 'N/A'}</small>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : '<small style="background: rgba(255,255,255,0.7); padding: 5px; border-radius: 4px;">No pickups assigned - direct route to destination</small>'}
                    
                    <div style="margin-top: 10px; padding: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; font-size: 0.9em;">
                        📏 Distance: <strong>${this.formatDistance(route.totalDistance)}</strong> | 
                        ⏱️ Duration: <strong>${this.formatDuration(route.totalDuration)}</strong><br>
                        🗺️ Route: <strong>${this.getProviderDisplayName(route.route?.provider || 'unknown')}</strong>
                        ${this.getRouteQualityInfo(route.route)}
                        ${this.getTrafficInfo(route.route)}
                    </div>
                    ${this.getRoutePathInfo(route.route)}
                </div>
            `;
        });
        
        mapContent.innerHTML = html;
        this.updateFallbackLegend(routes);
    }
    
    /**
     * Get route quality information for fallback display
     */
    getRouteQualityInfo(routeData) {
        if (!routeData) return '';
        
        if (routeData.provider === 'google_maps') {
            return '<br><small style="color: green;">✅ Real roads with live traffic data</small>';
        } else if (routeData.provider === 'osrm') {
            return '<br><small style="color: blue;">🗺️ Real roads, no traffic data</small>';
        } else if (routeData.provider === 'mock') {
            return '<br><small style="color: orange;">⚠️ Estimated straight-line distance</small>';
        }
        return '';
    }
    
    /**
     * Get traffic information for fallback display
     */
    getTrafficInfo(routeData) {
        if (!routeData || !routeData.traffic_info || !routeData.traffic_info.has_traffic_data) {
            return '';
        }
        
        const delayMinutes = Math.round(routeData.traffic_info.delay_seconds / 60);
        if (delayMinutes > 0) {
            return `<br><small style="color: orange;">🚨 Current traffic delay: ${delayMinutes} minutes</small>`;
        } else {
            return '<br><small style="color: green;">🚀 No traffic delays detected</small>';
        }
    }
    
    /**
     * Get route path information for fallback display
     */
    getRoutePathInfo(routeData) {
        if (!routeData || !routeData.geometry || routeData.provider === 'mock') {
            return '';
        }
        
        const coordinateCount = routeData.geometry.coordinates ? routeData.geometry.coordinates.length : 0;
        
        if (coordinateCount > 2) {
            return `
                <div style="margin-top: 8px; padding: 8px; background: rgba(0,100,200,0.1); border-radius: 4px; border-left: 3px solid #0064c8;">
                    <small><strong>🛣️ Route Path Details:</strong></small><br>
                    <small>• ${coordinateCount} coordinate points defining the actual route path</small><br>
                    <small>• Following real roads and traffic patterns</small><br>
                    <small>• ${routeData.provider === 'google_maps' ? 'Optimized based on current traffic conditions' : 'Based on OpenStreetMap road network'}</small>
                </div>
            `;
        }
        
        return '';
    }
    
    /**
     * Draw route using actual geometry from routing service
     */
    drawRouteGeometry(routeData, color, driverName, totalDistance, totalDuration, pickupCount) {
        if (!routeData || !routeData.geometry) {
            console.warn('No route geometry available, falling back to straight line');
            return;
        }
        
        // Convert geometry coordinates to Leaflet format [lat, lng]
        let routeCoordinates;
        
        if (routeData.geometry.type === 'LineString') {
            // Convert from [lng, lat] to [lat, lng] for Leaflet
            routeCoordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        } else {
            console.warn('Unsupported geometry type:', routeData.geometry.type);
            return;
        }
        
        // Determine route style based on provider and pickup count
        const routeStyle = {
            color: color,
            weight: pickupCount > 0 ? 4 : 3,
            opacity: pickupCount > 0 ? 0.8 : 0.6,
            dashArray: pickupCount === 0 ? '10, 10' : null
        };
        
        // Add route provider badge to style for different providers
        if (routeData.provider === 'google_maps') {
            routeStyle.className = 'route-google-maps';
        } else if (routeData.provider === 'osrm') {
            routeStyle.className = 'route-osrm';
        } else if (routeData.provider === 'mock') {
            routeStyle.className = 'route-mock';
            routeStyle.dashArray = '5, 5'; // Shorter dashes for mock routes
            routeStyle.opacity = 0.5;
        }
        
        // Create the route line
        const routeLine = L.polyline(routeCoordinates, routeStyle).addTo(this.map);
        
        // Create popup content with route details
        let popupContent = `
            <b>${pickupCount === 0 ? 'Direct Route' : 'Route'}: ${this.escapeHtml(driverName)}</b><br>
            Distance: ${this.formatDistance(totalDistance)}<br>
            Duration: ${this.formatDuration(totalDuration)}<br>
            ${pickupCount === 0 ? 'No pickups assigned' : `Stops: ${pickupCount}`}<br>
            <small>Provider: ${this.getProviderDisplayName(routeData.provider)}</small>
        `;
        
        // Add traffic information if available
        if (routeData.traffic_info && routeData.traffic_info.has_traffic_data) {
            const delayMinutes = Math.round(routeData.traffic_info.delay_seconds / 60);
            if (delayMinutes > 0) {
                popupContent += `<br><small style="color: orange;">⚠️ Traffic delay: ${delayMinutes} min</small>`;
            } else {
                popupContent += `<br><small style="color: green;">✅ No traffic delays</small>`;
            }
        }
        
        routeLine.bindPopup(popupContent);
        
        this.routeLines.push(routeLine);
    }
    
    /**
     * Get user-friendly provider display name
     */
    getProviderDisplayName(provider) {
        switch (provider) {
            case 'google_maps':
                return '🌍 Google Maps (Live Traffic)';
            case 'osrm':
                return '🗺️ OSRM (Real Roads)';
            case 'mock':
                return '📐 Estimated (Straight Line)';
            default:
                return provider;
        }
    }
    
    updateLeafletLegend(routes) {
        const legendElement = document.getElementById('mapLegend');
        if (!legendElement) return;
        
        let legendHTML = '<small><b>Route Legend:</b></small><br>';
        
        routes.forEach((route, index) => {
            const color = this.colors[index % this.colors.length];
            legendHTML += `
                <div style="margin: 3px 0; display: flex; align-items: center;">
                    <div style="width: 20px; height: 3px; background: ${color}; margin-right: 8px; ${route.pickups.length === 0 ? 'border: 1px dashed #666;' : ''}"></div>
                    <small>${this.escapeHtml(route.driverName)} (${route.pickups.length} stops)</small>
                </div>
            `;
        });
        
        legendHTML += '<br><small>🎯 = Destination | 🚗 = Driver | 📍 = Pickup</small>';
        
        legendElement.innerHTML = legendHTML;
    }
    
    updateFallbackLegend(routes) {
        const legendElement = document.getElementById('mapLegend');
        if (!legendElement) return;
        
        let legendHTML = '<div style="color: white;"><strong>📊 Route Summary:</strong><br>';
        
        routes.forEach((route, index) => {
            const color = this.colors[index % this.colors.length];
            legendHTML += `
                <div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 4px; border-left: 3px solid ${color};">
                    <strong>${this.escapeHtml(route.driverName)}</strong>: ${route.pickups.length} pickup${route.pickups.length !== 1 ? 's' : ''} | 
                    ${this.formatDistance(route.totalDistance)} | ${this.formatDuration(route.totalDuration)}
                </div>
            `;
        });
        
        const totalPickups = routes.reduce((sum, route) => sum + route.pickups.length, 0);
        const totalDistance = routes.reduce((sum, route) => sum + (route.totalDistance || 0), 0);
        
        legendHTML += `
            <hr style="border: 1px solid rgba(255,255,255,0.3); margin: 10px 0;">
            <small>📊 Total: ${totalPickups} pickup${totalPickups !== 1 ? 's' : ''} | ${this.formatDistance(totalDistance)} total distance</small>
        </div>`;
        
        legendElement.innerHTML = legendHTML;
    }
    
    clearMap() {
        if (!this.leafletAvailable) return;
        
        // Remove all markers
        this.markers.forEach(marker => {
            if (this.map && marker) {
                this.map.removeLayer(marker);
            }
        });
        this.markers = [];
        
        // Remove all route lines
        this.routeLines.forEach(line => {
            if (this.map && line) {
                this.map.removeLayer(line);
            }
        });
        this.routeLines = [];
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
        this.clearMap();
        if (this.map && this.leafletAvailable) {
            this.map.remove();
            this.map = null;
        }
        if (this.mapContainer) {
            this.mapContainer.innerHTML = '';
        }
    }
}