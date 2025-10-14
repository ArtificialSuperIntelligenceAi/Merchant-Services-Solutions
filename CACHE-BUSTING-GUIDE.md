# Cache Busting Guide for GitHub Pages

## The Problem
When you host a static site on GitHub Pages, browsers cache your files to improve performance. This means when you update your app, users might still see the old version until they clear their browser cache or do a hard refresh.

## The Solution
This app now includes multiple layers of cache busting to ensure users always get the latest version:

### 1. **Version-Based Cache Busting**
- Each file includes a version number in the URL parameters
- When you update the app, increment the version number
- Browsers treat it as a completely new file

### 2. **Timestamp-Based Cache Busting**
- Dynamic timestamps ensure even small changes are detected
- Combined with version numbers for maximum effectiveness

### 3. **HTTP Headers**
- Added cache-control headers to prevent aggressive caching
- Meta tags in HTML prevent browser caching

### 4. **LocalStorage Version Checking**
- App checks if it's running a new version
- Automatically clears cached data when version changes
- Shows user-friendly update notification

## How to Update Your App

### Method 1: Use the Update Script (Recommended)
```bash
# Update to a specific version
node update-version.js 1.0.1

# Or let it auto-generate a version with timestamp
node update-version.js
```

### Method 2: Manual Update
1. **Update version in `app.js`:**
   ```javascript
   const APP_VERSION = '1.0.1'; // Change this number
   ```

2. **Update script tags in HTML files:**
   ```html
   <!-- In index.html -->
   <script src="app.js?v=1.0.1&t=20241201"></script>
   
   <!-- In admin.html -->
   <script src="admin.js?v=1.0.1&t=20241201"></script>
   ```

3. **Update admin.js cache busting function:**
   ```javascript
   return `${url}${separator}v=1.0.1&t=${Date.now()}`;
   ```

## What Happens When Users Visit

1. **First Visit:** App loads normally
2. **Return Visit (Same Version):** Uses cached version for speed
3. **Return Visit (New Version):** 
   - Detects version change
   - Clears old cached data
   - Shows "App updated" notification
   - Loads fresh data from server

## Testing Your Updates

1. **Deploy your changes** to GitHub Pages
2. **Open the app** in a browser
3. **Check the console** for version detection messages
4. **Look for the green notification** if it's a new version
5. **Verify new features** are working

## Advanced: Service Worker (Optional)

For even more control, you could add a service worker:

```javascript
// sw.js
self.addEventListener('fetch', event => {
  if (event.request.url.includes('data/solutions.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
    );
  }
});
```

## Troubleshooting

### Users Still See Old Version
1. Check that you updated ALL version numbers
2. Verify the files are actually updated on GitHub
3. Try opening in an incognito/private window
4. Check browser developer tools for cached files

### App Shows "Updated" Notification Too Often
- Make sure you're only incrementing the version when you actually make changes
- The notification only shows when the version actually changes

### Performance Concerns
- Cache busting only affects the initial load
- Once loaded, the app runs normally
- The timestamp ensures even small updates are detected

## Best Practices

1. **Increment version** for any functional changes
2. **Use semantic versioning** (1.0.0 → 1.0.1 → 1.1.0)
3. **Test locally** before deploying
4. **Keep version numbers consistent** across all files
5. **Document changes** in commit messages

## Files That Need Version Updates

- `app.js` - Main app version constant
- `index.html` - Script tag version
- `admin.html` - Admin script tag version  
- `admin.js` - Admin cache busting function

Remember: The goal is to make sure users always get the latest version of your app without having to manually clear their browser cache!

