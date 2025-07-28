# Google Maps API Setup Guide

This guide will help you set up Google Maps API to enable real routing with live traffic data in the Driving Assignments application.

## 🚀 Quick Setup

### Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **"Create Project"** or select an existing project
4. Enter a project name (e.g., "Driving Assignments App")
5. Click **"Create"**

### Step 2: Enable APIs

1. In the Google Cloud Console, go to **"APIs & Services" > "Library"**
2. Search for and enable these APIs:
   - **Directions API** (required for routing)
   - **Places API** (optional, for better address search)

### Step 3: Create API Key

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"+ CREATE CREDENTIALS" > "API key"**
3. Copy the generated API key
4. Click **"Restrict Key"** (recommended for security)

### Step 4: Configure API Key Restrictions (Recommended)

#### Application Restrictions:
- Select **"HTTP referrers (web sites)"**
- Add your domain(s):
  - `http://localhost:*` (for local development)
  - `https://yourdomain.com/*` (for production)
  - `https://yourname.github.io/*` (for GitHub Pages)

#### API Restrictions:
- Select **"Restrict key"**
- Choose:
  - **Directions API**
  - **Places API** (if you enabled it)

### Step 5: Configure the Application

1. Open `js/config.js` in your project
2. Add your API key:

```javascript
export const CONFIG = {
    GOOGLE_MAPS: {
        API_KEY: 'YOUR_API_KEY_HERE', // Replace with your actual API key
        // ... rest of config
    }
};
```

**Alternative**: Set the API key dynamically (more secure):

```javascript
// In your app initialization
import { ConfigManager } from './js/config.js';
ConfigManager.setGoogleMapsApiKey('YOUR_API_KEY_HERE');
```

## 💰 Billing Information

### Free Tier
Google Maps provides a generous free tier:
- **$200 credit per month**
- **Directions API**: ~$5 per 1,000 requests
- **Free usage**: ~40,000 direction requests per month

### Typical Usage
For a carpool coordination app:
- **Small groups (5-10 people)**: Well within free tier
- **Large organizations**: Monitor usage in Google Cloud Console

### Cost Control
1. Set up **billing alerts** in Google Cloud Console
2. Set **API quotas** to limit usage
3. Monitor usage in **"APIs & Services" > "Quotas"**

## 🔧 Configuration Options

### Basic Configuration
```javascript
GOOGLE_MAPS: {
    API_KEY: 'your-api-key',
    DEFAULT_OPTIONS: {
        avoid: 'tolls',     // Options: tolls, highways, ferries, indoor
        units: 'metric',    // Options: metric, imperial
        mode: 'driving',    // Options: driving, walking, bicycling, transit
        departure_time: 'now' // Use current time for traffic data
    }
}
```

### Advanced Options
```javascript
DEFAULT_OPTIONS: {
    avoid: 'highways',           // Avoid highways for city driving
    traffic_model: 'best_guess', // best_guess, pessimistic, optimistic
    departure_time: 'now',       // or specific timestamp
    alternatives: true,          // Get alternative routes
    optimize: true               // Optimize waypoint order
}
```

## 🧪 Testing Your Setup

### 1. Check Configuration
Open your browser's developer console and run:
```javascript
import { ConfigManager } from './js/config.js';
console.log('Routing mode:', ConfigManager.getRoutingMode());
console.log('Description:', ConfigManager.getRoutingDescription());
```

### 2. Test Routing
1. Set up a destination and some drivers/pickups
2. Go to the "Routes" tab
3. Look for "Google Maps Directions API (with live traffic)" in the status
4. Check browser console for any API errors

### 3. Verify Traffic Data
- Test during different times of day
- Compare routes during peak vs off-peak hours
- Routes should show different durations based on traffic

## 🔒 Security Best Practices

### 1. API Key Security
- **Never commit API keys to public repositories**
- Use environment variables or secure config files
- Restrict API key usage by domain/IP

### 2. Usage Monitoring
- Set up billing alerts
- Monitor API usage regularly
- Implement client-side caching to reduce requests

### 3. Error Handling
The application automatically falls back to alternative routing methods:
1. **Google Maps API** (if configured)
2. **OSRM** (free, open-source routing)
3. **Mock routing** (straight-line estimates)

## 🚨 Troubleshooting

### Common Issues

#### "API key not valid"
- Check that the API key is correct
- Verify that Directions API is enabled
- Check API key restrictions

#### "Request denied"
- Check domain restrictions on API key
- Verify billing account is set up
- Check API quotas haven't been exceeded

#### "Quota exceeded"
- Check usage in Google Cloud Console
- Increase quotas or wait for reset
- Consider implementing caching

### Debug Mode
Enable debug logging:
```javascript
// In browser console
localStorage.setItem('routing_debug', 'true');
```

### Getting Help
1. Check browser console for error messages
2. Verify API key setup in Google Cloud Console
3. Test with simple routes first
4. Check [Google Maps API documentation](https://developers.google.com/maps/documentation/directions)

## 📈 Optimization Tips

### 1. Reduce API Calls
- Cache results for repeated routes
- Batch multiple destination requests
- Use route optimization for multiple stops

### 2. Improve Performance
- Enable compression in your web server
- Use CDN for static assets
- Implement client-side caching

### 3. Cost Management
- Set daily spending limits
- Use API quotas effectively
- Monitor usage patterns

## 🎯 Next Steps

Once configured, your application will:
- ✅ Use real road routing instead of straight lines
- ✅ Include live traffic data in time estimates
- ✅ Provide turn-by-turn directions
- ✅ Optimize multi-stop routes automatically
- ✅ Fall back gracefully if API is unavailable

## 📞 Support

- **Google Maps API Issues**: [Google Maps Platform Support](https://developers.google.com/maps/support)
- **Application Issues**: Create an issue in this repository
- **General Questions**: Check the README.md file

---

**Ready to get started?** Follow the steps above to enable real routing with live traffic data! 🚗📍