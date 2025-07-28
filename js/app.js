// Main application entry point
import { DataManager } from './dataManager.js';
import { GeocodingService } from './geocodingService.js';
import { RoutingService } from './routingService.js';
import { MapManager } from './mapManager.js';
import { UIManager } from './uiManager.js';

class DrivingAssignmentsApp {
    constructor() {
        this.dataManager = new DataManager();
        this.geocodingService = new GeocodingService();
        this.routingService = new RoutingService();
        this.mapManager = new MapManager();
        this.uiManager = new UIManager();
        
        this.currentPage = 'setup';
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadStoredData();
        this.uiManager.updateUI(this.dataManager.getData());
    }
    
    setupEventListeners() {
        // Navigation
        document.getElementById('setupBtn').addEventListener('click', () => this.showPage('setup'));
        document.getElementById('assignBtn').addEventListener('click', () => this.showPage('assign'));
        document.getElementById('routeBtn').addEventListener('click', () => this.showPage('route'));
        
        // Setup page
        document.getElementById('geocodeDestination').addEventListener('click', () => this.handleDestinationGeocode());
        document.getElementById('addDriver').addEventListener('click', () => this.handleAddDriver());
        document.getElementById('addPickup').addEventListener('click', () => this.handleAddPickup());
        
        // Assignment page
        document.getElementById('calculateRoutes').addEventListener('click', () => this.handleCalculateRoutes());
        
        // Auto-assign functionality
        document.addEventListener('autoAssign', (e) => this.handleAutoAssign(e.detail.method));
        
        // Handle dynamic event delegation for remove buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                this.handleRemoveItem(e.target);
            }
        });
    }
    
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        // Show selected page
        document.getElementById(pageId + 'Page').classList.add('active');
        document.getElementById(pageId + 'Btn').classList.add('active');
        
        this.currentPage = pageId;
        
        // Update UI based on current page
        if (pageId === 'assign') {
            this.uiManager.renderAssignmentInterface(this.dataManager.getData());
        } else if (pageId === 'route') {
            this.uiManager.renderRouteResults(this.dataManager.getData());
            this.mapManager.initializeMap();
        }
    }
    
    async handleDestinationGeocode() {
        const address = document.getElementById('destinationAddress').value.trim();
        const arrivalTime = document.getElementById('arrivalTime').value;
        
        if (!address || !arrivalTime) {
            this.showStatus('destinationStatus', 'Please enter both address and arrival time', 'error');
            return;
        }
        
        this.showLoading(true);
        this.showStatus('destinationStatus', 'Geocoding destination...', 'loading');
        
        try {
            const coords = await this.geocodingService.geocodeAddress(address);
            this.dataManager.setDestination({
                address,
                arrivalTime,
                coordinates: coords
            });
            
            this.showStatus('destinationStatus', `Destination set: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`, 'success');
            this.saveData();
        } catch (error) {
            this.showStatus('destinationStatus', 'Failed to geocode destination: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async handleAddDriver() {
        const name = document.getElementById('driverName').value.trim();
        const address = document.getElementById('driverAddress').value.trim();
        
        if (!name || !address) {
            alert('Please enter both driver name and address');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const coords = await this.geocodingService.geocodeAddress(address);
            this.dataManager.addDriver({
                id: Date.now().toString(),
                name,
                address,
                coordinates: coords
            });
            
            document.getElementById('driverName').value = '';
            document.getElementById('driverAddress').value = '';
            
            this.uiManager.updateDriversList(this.dataManager.getData().drivers);
            this.saveData();
        } catch (error) {
            alert('Failed to geocode driver address: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    async handleAddPickup() {
        const name = document.getElementById('pickupName').value.trim();
        const address = document.getElementById('pickupAddress').value.trim();
        
        if (!name || !address) {
            alert('Please enter both person name and pickup address');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const coords = await this.geocodingService.geocodeAddress(address);
            this.dataManager.addPickup({
                id: Date.now().toString(),
                name,
                address,
                coordinates: coords
            });
            
            document.getElementById('pickupName').value = '';
            document.getElementById('pickupAddress').value = '';
            
            this.uiManager.updatePickupsList(this.dataManager.getData().pickups);
            this.saveData();
        } catch (error) {
            alert('Failed to geocode pickup address: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    handleRemoveItem(button) {
        const itemId = button.dataset.id;
        const itemType = button.dataset.type;
        
        if (itemType === 'driver') {
            this.dataManager.removeDriver(itemId);
            this.uiManager.updateDriversList(this.dataManager.getData().drivers);
        } else if (itemType === 'pickup') {
            this.dataManager.removePickup(itemId);
            this.uiManager.updatePickupsList(this.dataManager.getData().pickups);
        }
        
        this.saveData();
    }
    
    async handleCalculateRoutes() {
        const data = this.dataManager.getData();
        
        if (!data.destination) {
            alert('Please set a destination first');
            return;
        }
        
        if (data.drivers.length === 0) {
            alert('Please add at least one driver');
            return;
        }
        
        if (data.pickups.length === 0) {
            alert('Please add at least one pickup location');
            return;
        }
        
        // Get assignments from UI
        const assignments = this.uiManager.getAssignments();
        
        this.showLoading(true);
        
        try {
            const routes = await this.routingService.calculateAllRoutes(data, assignments);
            this.dataManager.setRoutes(routes);
            
            this.uiManager.renderRouteResults(this.dataManager.getData());
            
            this.showPage('route');
            
            // Display routes on map after page is shown and map is initialized
            this.mapManager.displayRoutes(routes, data);
            this.saveData();
        } catch (error) {
            alert('Failed to calculate routes: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    async handleAutoAssign(method) {
        const data = this.dataManager.getData();
        
        if (!data.destination) {
            alert('Please set a destination first');
            return;
        }
        
        if (data.drivers.length === 0) {
            alert('Please add at least one driver');
            return;
        }
        
        if (data.pickups.length === 0) {
            alert('Please add at least one pickup location');
            return;
        }
        
        this.showLoading(true);
        
        try {
            let assignments;
            
            if (method === 'greedy') {
                assignments = await this.routingService.autoAllocatePickups(data);
            } else if (method === 'cluster') {
                assignments = await this.routingService.clusterBasedAllocation(
                    data.drivers, 
                    data.pickups, 
                    data.destination
                );
            }
            
            // Apply the assignments to the UI
            this.uiManager.applyAutoAssignment(assignments);
            
        } catch (error) {
            alert('Failed to auto-assign pickups: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    showStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `status ${type}`;
    }
    
    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.add('active');
        } else {
            this.loadingOverlay.classList.remove('active');
        }
    }
    
    saveData() {
        this.dataManager.saveToLocalStorage();
    }
    
    loadStoredData() {
        this.dataManager.loadFromLocalStorage();
        const data = this.dataManager.getData();
        
        // Populate form fields if destination exists
        if (data.destination) {
            document.getElementById('destinationAddress').value = data.destination.address || '';
            document.getElementById('arrivalTime').value = data.destination.arrivalTime || '';
            
            if (data.destination.coordinates) {
                this.showStatus('destinationStatus', 
                    `Destination set: ${data.destination.coordinates.lat.toFixed(6)}, ${data.destination.coordinates.lng.toFixed(6)}`, 
                    'success'
                );
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DrivingAssignmentsApp();
});