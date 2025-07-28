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
        
        data.drivers.forEach(driver => {
            const driverDiv = document.createElement('div');
            driverDiv.className = 'driver-assignment';
            
            driverDiv.innerHTML = `
                <h3>${this.escapeHtml(driver.name)}</h3>
                <div class="pickup-checkboxes" data-driver-id="${driver.id}">
                    ${data.pickups.map(pickup => `
                        <label class="pickup-checkbox">
                            <input type="checkbox" data-pickup-id="${pickup.id}" data-driver-id="${driver.id}">
                            <span>${this.escapeHtml(pickup.name)} - ${this.escapeHtml(pickup.address)}</span>
                        </label>
                    `).join('')}
                </div>
            `;
            
            container.appendChild(driverDiv);
        });
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
        
        return `
            <h3>${this.escapeHtml(route.driverName)}</h3>
            <div class="route-info">
                <div class="route-summary">
                    <strong>Route Summary:</strong><br>
                    Departure Time: <strong>${departureTime}</strong><br>
                    Total Distance: <strong>${totalDistance}</strong><br>
                    Total Duration: <strong>${totalDuration}</strong><br>
                    Pickups: <strong>${route.pickups.length}</strong>
                </div>
                ${pickupTimesHTML}
            </div>
        `;
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