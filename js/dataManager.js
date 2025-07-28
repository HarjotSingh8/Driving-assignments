// Data management and LocalStorage handling
export class DataManager {
    constructor() {
        this.data = {
            destination: null,
            drivers: [],
            pickups: [],
            routes: []
        };
    }
    
    getData() {
        return this.data;
    }
    
    setDestination(destination) {
        this.data.destination = destination;
    }
    
    addDriver(driver) {
        this.data.drivers.push(driver);
    }
    
    removeDriver(driverId) {
        this.data.drivers = this.data.drivers.filter(driver => driver.id !== driverId);
    }
    
    addPickup(pickup) {
        this.data.pickups.push(pickup);
    }
    
    removePickup(pickupId) {
        this.data.pickups = this.data.pickups.filter(pickup => pickup.id !== pickupId);
    }
    
    setRoutes(routes) {
        this.data.routes = routes;
    }
    
    saveToLocalStorage() {
        try {
            localStorage.setItem('drivingAssignments', JSON.stringify(this.data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }
    
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('drivingAssignments');
            if (stored) {
                this.data = { ...this.data, ...JSON.parse(stored) };
                
                // Ensure arrays exist even if not in stored data
                this.data.drivers = this.data.drivers || [];
                this.data.pickups = this.data.pickups || [];
                this.data.routes = this.data.routes || [];
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
    }
    
    clearAllData() {
        this.data = {
            destination: null,
            drivers: [],
            pickups: [],
            routes: []
        };
        localStorage.removeItem('drivingAssignments');
    }
}