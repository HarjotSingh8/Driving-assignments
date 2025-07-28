// UI management and dynamic content rendering
export class UIManager {
    constructor() {
        this.routingService = null; // Will be injected when needed
    }
    
    updateUI(data) {
        this.updateDriversList(data.drivers);
        this.updatePickupsList(data.pickups);
    }
    
    updateDriversList(drivers) {
        const container = document.getElementById('driversList');
        container.innerHTML = '';
        
        drivers.forEach(driver => {
            const element = this.createItemElement(driver, 'driver');
            container.appendChild(element);
        });
    }
    
    updatePickupsList(pickups) {
        const container = document.getElementById('pickupsList');
        container.innerHTML = '';
        
        pickups.forEach(pickup => {
            const element = this.createItemElement(pickup, 'pickup');
            container.appendChild(element);
        });
    }
    
    createItemElement(item, type) {
        const div = document.createElement('div');
        div.className = 'item';
        
        const coords = item.coordinates;
        const coordsText = coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'No coordinates';
        
        div.innerHTML = `
            <div class="item-info">
                <div class="item-name">${this.escapeHtml(item.name)}</div>
                <div class="item-address">${this.escapeHtml(item.address)}</div>
                <div class="item-coords">${coordsText}</div>
            </div>
            <button class="remove-btn" data-id="${item.id}" data-type="${type}">Remove</button>
        `;
        
        return div;
    }
    
    renderAssignmentInterface(data) {
        const container = document.getElementById('assignmentInterface');
        container.innerHTML = '';
        
        if (data.drivers.length === 0 || data.pickups.length === 0) {
            container.innerHTML = '<p class="text-center">Please add drivers and pickup locations first.</p>';
            return;
        }
        
        // Add auto-assign controls
        const autoAssignDiv = document.createElement('div');
        autoAssignDiv.className = 'auto-assign-controls';
        autoAssignDiv.innerHTML = `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0;">🤖 Automatic Assignment</h3>
                <p>Let the system automatically assign pickups to drivers to minimize travel distance.</p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="autoAssignGreedy" class="auto-assign-btn">Smart Auto-Assign</button>
                    <button id="autoAssignCluster" class="auto-assign-btn">Geographic Clustering</button>
                    <button id="clearAllAssignments" class="clear-assign-btn">Clear All</button>
                </div>
                <small style="color: #666; display: block; margin-top: 10px;">
                    Smart Auto-Assign balances distance and workload. Geographic Clustering assigns based on proximity only.
                </small>
            </div>
        `;
        container.appendChild(autoAssignDiv);
        
        // Add manual assignment interface
        const manualDiv = document.createElement('div');
        manualDiv.className = 'manual-assignment';
        manualDiv.innerHTML = '<h3>📝 Manual Assignment</h3>';
        
        data.drivers.forEach(driver => {
            const driverDiv = document.createElement('div');
            driverDiv.className = 'driver-assignment';
            
            driverDiv.innerHTML = `
                <h4>${this.escapeHtml(driver.name)}</h4>
                <div class="pickup-checkboxes" data-driver-id="${driver.id}">
                    ${data.pickups.map(pickup => `
                        <label class="pickup-checkbox">
                            <input type="checkbox" data-pickup-id="${pickup.id}" data-driver-id="${driver.id}">
                            <span>${this.escapeHtml(pickup.name)} - ${this.escapeHtml(pickup.address)}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            
            manualDiv.appendChild(driverDiv);
        });
        
        container.appendChild(manualDiv);
        
        // Add event listeners for auto-assign buttons
        this.setupAutoAssignListeners();
    }
    
    setupAutoAssignListeners() {
        const greedyBtn = document.getElementById('autoAssignGreedy');
        const clusterBtn = document.getElementById('autoAssignCluster');
        const clearBtn = document.getElementById('clearAllAssignments');
        
        if (greedyBtn) {
            greedyBtn.addEventListener('click', () => {
                this.triggerAutoAssign('greedy');
            });
        }
        
        if (clusterBtn) {
            clusterBtn.addEventListener('click', () => {
                this.triggerAutoAssign('cluster');
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllAssignments();
            });
        }
    }
    
    triggerAutoAssign(method) {
        // Dispatch custom event for the app to handle
        const event = new CustomEvent('autoAssign', { 
            detail: { method } 
        });
        document.dispatchEvent(event);
    }
    
    clearAllAssignments() {
        // Clear all checkboxes
        document.querySelectorAll('.pickup-checkboxes input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.showMessage('All assignments cleared', 'success');
    }
    
    applyAutoAssignment(assignments) {
        // First clear all existing assignments
        this.clearAllAssignments();
        
        // Apply the new assignments
        Object.keys(assignments).forEach(driverId => {
            const pickupIds = assignments[driverId];
            pickupIds.forEach(pickupId => {
                const checkbox = document.querySelector(
                    `input[data-driver-id="${driverId}"][data-pickup-id="${pickupId}"]`
                );
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        });
        
        // Count assignments for feedback
        const totalAssignments = Object.values(assignments).reduce((sum, pickups) => sum + pickups.length, 0);
        this.showMessage(`Auto-assigned ${totalAssignments} pickups to drivers`, 'success');
    }
    
    getAssignments() {
        const assignments = {};
        
        document.querySelectorAll('.pickup-checkboxes').forEach(container => {
            const driverId = container.dataset.driverId;
            assignments[driverId] = [];
            
            container.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                assignments[driverId].push(checkbox.dataset.pickupId);
            });
        });
        
        return assignments;
    }
    
    renderRouteResults(data) {
        const container = document.getElementById('routeResults');
        container.innerHTML = '';
        
        if (!data.routes || data.routes.length === 0) {
            container.innerHTML = '<p class="text-center">No routes calculated yet. Go to the Assign page and click "Calculate Routes".</p>';
            return;
        }
        
        data.routes.forEach(route => {
            const routeDiv = document.createElement('div');
            routeDiv.className = 'driver-route';
            
            routeDiv.innerHTML = this.createRouteHTML(route);
            container.appendChild(routeDiv);
        });
    }
    
    createRouteHTML(route) {
        const departureTime = route.pickupTimes?.formattedDepartureTime || 'N/A';
        const totalDistance = this.formatDistance(route.totalDistance);
        const totalDuration = this.formatDuration(route.totalDuration);
        
        // Get routing provider and traffic information
        const provider = route.route?.provider || 'unknown';
        const trafficInfo = route.route?.traffic_info;
        
        // Create routing provider badge
        const providerBadge = this.createProviderBadge(provider);
        
        // Create traffic information section
        let trafficHTML = '';
        if (trafficInfo && trafficInfo.has_traffic_data) {
            const delay = trafficInfo.delay_seconds;
            const delayClass = delay > 300 ? 'traffic-heavy' : delay > 60 ? 'traffic-moderate' : 'traffic-light';
            const delayText = delay > 0 ? `+${this.formatDuration(delay)} delay` : 'No delays';
            
            trafficHTML = `
                <div class="traffic-info ${delayClass}">
                    <strong>🚦 Live Traffic:</strong> ${delayText}<br>
                    <small>Normal time: ${this.formatDuration(trafficInfo.normal_duration)} | With traffic: ${this.formatDuration(trafficInfo.traffic_duration)}</small>
                </div>
            `;
        } else if (provider === 'google_maps') {
            trafficHTML = `
                <div class="traffic-info traffic-unavailable">
                    <strong>🚦 Traffic:</strong> Data unavailable for this route
                </div>
            `;
        }
        
        let pickupTimesHTML = '';
        if (route.pickupTimes?.pickupTimes && route.pickupTimes.pickupTimes.length > 0) {
            pickupTimesHTML = `
                <div class="pickup-times">
                    <h4>Pickup Schedule:</h4>
                    ${route.pickupTimes.pickupTimes.map(pt => `
                        <div class="pickup-time">
                            <span>${this.escapeHtml(pt.pickup.name)}</span>
                            <span>${pt.formattedTime}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Add route directions if available
        let directionsHTML = '';
        if (route.route?.legs && route.route.legs.length > 0) {
            const hasDetailedSteps = route.route.legs.some(leg => 
                leg.steps && leg.steps.length > 0 && leg.steps[0].instruction
            );
            
            if (hasDetailedSteps) {
                directionsHTML = `
                    <div class="route-directions">
                        <h4>🗺️ Directions:</h4>
                        <div class="directions-summary">
                            ${route.route.legs.map((leg, index) => `
                                <div class="leg-summary">
                                    <strong>Leg ${index + 1}:</strong> ${this.formatDistance(leg.distance)} in ${this.formatDuration(leg.duration)}
                                    ${leg.start_address ? `<br><small>From: ${this.escapeHtml(leg.start_address)}</small>` : ''}
                                    ${leg.end_address ? `<br><small>To: ${this.escapeHtml(leg.end_address)}</small>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        return `
            <div class="route-header">
                <h3>${this.escapeHtml(route.driverName)}</h3>
                ${providerBadge}
            </div>
            <div class="route-info">
                <div class="route-summary">
                    <strong>📊 Route Summary:</strong><br>
                    Departure Time: <strong>${departureTime}</strong><br>
                    Total Distance: <strong>${totalDistance}</strong><br>
                    Total Duration: <strong>${totalDuration}</strong><br>
                    Pickups: <strong>${route.pickups.length}</strong>
                </div>
                ${trafficHTML}
                ${pickupTimesHTML}
                ${directionsHTML}
            </div>
        `;
    }
    
    createProviderBadge(provider) {
        const badges = {
            'google_maps': '<span class="provider-badge google-maps">📍 Google Maps (Live Traffic)</span>',
            'osrm': '<span class="provider-badge osrm">🗺️ OSRM (Real Roads)</span>',
            'mock': '<span class="provider-badge mock">📐 Estimated (Straight Line)</span>',
            'unknown': '<span class="provider-badge unknown">❓ Unknown Provider</span>'
        };
        
        return badges[provider] || badges['unknown'];
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showMessage(message, type = 'info') {
        // Create a temporary message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `status ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '1001';
        messageDiv.style.maxWidth = '300px';
        
        document.body.appendChild(messageDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}