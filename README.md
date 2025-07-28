# Driving Assignments Web App

A comprehensive web application for coordinating driving assignments, pickup locations, and route optimization with accurate timing calculations. Perfect for organizing carpools, group transportation, or event logistics.

![Driving Assignments Setup Interface](https://github.com/user-attachments/assets/f7619054-d1b2-4943-887e-b8ec61897dab)

## 🚀 Features

### 🎯 Destination Management
- Set destination address with target arrival time
- Automatic geocoding to convert addresses to coordinates
- Visual confirmation of geocoded locations

### 🚗 Driver Management
- Add multiple drivers with their starting addresses
- Automatic geocoding of driver locations
- Easy removal of drivers with confirmation

### 📍 Pickup Location Management
- Add pickup locations with person names and addresses
- Geocoding for all pickup addresses
- Simple interface for managing pickup list

### 🔗 Assignment Interface
- Intuitive checkbox system to assign pickups to drivers
- Visual grouping by driver
- Flexible assignment allowing any combination

### ⏰ Route Calculation & Timing
- **Real routing with live traffic data** using Google Maps Directions API
- **Automatic fallback system**: Google Maps → OSRM → Mock routing
- Optimal pickup ordering using nearest neighbor algorithm
- **Traffic-aware duration calculations** with real-time delay information
- Pickup time calculation working backwards from arrival time
- 5-minute buffer automatically applied
- Display of departure times and individual pickup schedules
- **Turn-by-turn directions** and detailed route information

### 🗺️ Route Visualization
- Detailed route information for each driver
- Visual display of coordinates and addresses
- Route summary with total distance and duration
- Ready for Leaflet map integration

### 💾 Data Persistence
- Complete LocalStorage integration
- All data persists across browser sessions
- Automatic save/load functionality

![Routes and Pickup Times](https://github.com/user-attachments/assets/f382f3c8-45fb-4bb4-9c0e-ada4db11533d)

## 🛠️ Technical Architecture

The application uses a modular ES6 architecture with clean separation of concerns:

```
js/
├── app.js              # Main application controller
├── dataManager.js      # State management and LocalStorage persistence
├── geocodingService.js # Address to coordinates conversion (Nominatim API)
├── routingService.js   # Route calculation and optimization (OSRM API)
├── mapManager.js       # Map visualization (Leaflet integration)
└── uiManager.js        # Dynamic interface updates
```

### Key Components

- **DataManager**: Handles application state and LocalStorage persistence
- **GeocodingService**: Converts addresses to coordinates using Nominatim API
- **RoutingService**: Calculates routes and optimizes pickup orders using OSRM API
- **MapManager**: Handles route visualization with Leaflet
- **UIManager**: Manages dynamic interface updates and user interactions
- **App**: Main application controller coordinating all services

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- **Optional**: Google Maps API key for live traffic data ([Setup Guide](GOOGLE_MAPS_SETUP.md))
- No server setup required - runs entirely client-side

### Installation

1. Clone the repository:
```bash
git clone https://github.com/HarjotSingh8/Driving-assignments.git
cd Driving-assignments
```

2. Open `index.html` in your web browser or serve it using a local web server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

3. Navigate to `http://localhost:8000` in your browser

### 🗺️ Configure Routing (Optional but Recommended)

For the best experience with **real routing and live traffic data**:

1. **Get a Google Maps API key** - Follow our [Setup Guide](GOOGLE_MAPS_SETUP.md)
2. **Configure the API key** in the app:
   - Go to the "Setup" tab
   - Find the "🗺️ Routing Configuration" section  
   - Enter your API key and click "Save"
3. **Enjoy real routing** with live traffic data!

**Without API key**: The app automatically falls back to OSRM (real roads, no traffic) or mock routing.

## 🌐 Deployment

### Automated GitHub Pages Deployment

This repository includes automated deployment to GitHub Pages using GitHub Actions. The deployment happens automatically whenever changes are pushed to the `main` branch.

#### Setup Instructions

1. **Enable GitHub Pages**: 
   - Go to your repository settings on GitHub
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"

2. **Configure Repository Settings**:
   - Ensure the repository is public (GitHub Pages for private repos requires GitHub Pro)
   - The deployment workflow is already configured in `.github/workflows/deploy.yml`

3. **Automatic Deployment**:
   - Push changes to the `main` branch
   - GitHub Actions will automatically build and deploy to GitHub Pages
   - Your app will be available at: `https://[username].github.io/[repository-name]`

For this repository, the live demo is available at:
**https://harjotsingh8.github.io/Driving-assignments/**

#### Manual Deployment

If you prefer to deploy manually or to other hosting platforms:

**Netlify Drop**:
1. Build the project locally (no build step required - it's static)
2. Drag and drop the entire folder to [Netlify Drop](https://app.netlify.com/drop)

**Vercel**:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts

**Traditional Web Hosting**:
1. Upload all files to your web server
2. Ensure `index.html` is in the root directory
3. Configure your server to serve static files

#### Deployment Checklist

- [ ] Repository is public (for free GitHub Pages)
- [ ] GitHub Pages is enabled in repository settings
- [ ] Source is set to "GitHub Actions"
- [ ] Latest changes are pushed to `main` branch
- [ ] Check GitHub Actions tab for deployment status

### Usage

#### 1. Setup Phase
1. **Set Destination**: Enter the destination address and desired arrival time
2. **Add Drivers**: Add driver names and their starting addresses
3. **Add Pickups**: Add people to be picked up with their addresses

#### 2. Assignment Phase
1. Navigate to the "Assign" tab
2. Use checkboxes to assign pickup locations to specific drivers
3. Multiple assignments per driver are supported

#### 3. Route Calculation
1. Click "Calculate Routes" to generate optimized routes
2. View detailed route information including:
   - Driver departure times
   - Individual pickup times
   - Total distance and duration
   - Optimized pickup order

## 🔧 API Integration

The application now supports **real routing with live traffic data** through multiple routing providers:

### 🚗 Google Maps Directions API (Recommended)
- **Real road routing** with turn-by-turn directions
- **Live traffic data** for accurate travel time estimates
- **Traffic-aware routing** that accounts for current conditions
- **Multiple routing options** (avoid tolls, highways, etc.)
- **Setup required**: See [Google Maps API Setup Guide](GOOGLE_MAPS_SETUP.md)

### 🗺️ OSRM (Open Source Routing Machine) 
- **Free alternative** with real road routing using OpenStreetMap data
- **No API key required** - works out of the box
- **Good accuracy** for basic routing needs
- **No traffic data** - uses static travel time estimates

### 📐 Mock Routing (Fallback)
- **Always available** - works offline
- **Straight-line distance** calculations with estimated travel times
- **Fallback option** when other services are unavailable

### 🔄 Automatic Fallback System
The application intelligently selects the best available routing method:
1. **Google Maps API** (if configured with API key)
2. **OSRM** (if Google Maps unavailable or not configured)  
3. **Mock routing** (guaranteed fallback for offline use)

### Current Implementation Features
- **Real-time traffic integration** when using Google Maps API
- **Provider badges** showing which routing method is being used
- **Traffic delay indicators** with color-coded warnings
- **Detailed turn-by-turn directions** for supported providers
- **Route optimization** for multiple pickup locations
- **Caching system** to reduce API calls and improve performance

## 🎨 Customization

### Styling
- Modify `styles.css` to customize the appearance
- CSS custom properties are used for easy theming
- Responsive design works on desktop and mobile devices

### Map Integration
- Leaflet integration is prepared in `mapManager.js`
- Add your preferred map tiles and styling
- Customize markers and route visualization

### API Services
- Replace mock services with real API implementations
- Add error handling and retry logic
- Implement caching for better performance

## 📱 Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile browsers**: Responsive design supported

### Requirements
- ES6 module support
- LocalStorage API
- Fetch API
- Modern CSS features (Grid, Flexbox)

## 🔒 Privacy & Data

- All data is stored locally in the browser's LocalStorage
- No data is sent to external servers (except API calls for geocoding/routing)
- No user registration or authentication required
- Data persists until explicitly cleared or browser storage is reset

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:

1. Check the browser console for error messages
2. Ensure you have a stable internet connection for API calls
3. Try clearing browser LocalStorage and refreshing
4. Open an issue on GitHub with detailed information

## 🚀 Future Enhancements

- Real-time GPS tracking integration
- Multi-day assignment planning
- Export routes to external navigation apps
- Advanced optimization algorithms
- Team collaboration features
- Mobile app development

---

**Built with ❤️ using vanilla JavaScript, HTML5, and CSS3**