// Becoming PWA Service Worker
// Provides offline functionality and caching for the therapeutic journaling app

const CACHE_NAME = 'becoming-v1.0.0';
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_NAME}-dynamic`;

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Note: Vite builds will be handled dynamically
];

// Cache duration for different resource types
const CACHE_DURATION = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000,     // 24 hours
  API: 5 * 60 * 1000,               // 5 minutes
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    (async () => {
      try {
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        
        // Cache the basic shell - be conservative to avoid errors
        await staticCache.addAll(['/']);
        
        console.log('[SW] Static assets cached');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('[SW] Failed to cache static assets:', error);
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('becoming-') && 
          !name.includes('v1.0.0')
        );
        
        await Promise.all(
          oldCaches.map(name => caches.delete(name))
        );
        
        console.log('[SW] Old caches cleaned up');
        
        // Take control of all clients
        await self.clients.claim();
      } catch (error) {
        console.error('[SW] Failed to activate:', error);
      }
    })()
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests that aren't OpenAI API calls
  if (url.origin !== self.location.origin && !isOpenAIRequest(url)) {
    return;
  }
  
  // Handle different types of requests
  if (isOpenAIRequest(url)) {
    // OpenAI API requests - network first with short cache
    event.respondWith(handleOpenAIRequest(request));
  } else if (isStaticAsset(url)) {
    // Static assets - cache first
    event.respondWith(handleStaticAsset(request));
  } else {
    // App shell and dynamic content - network first with fallback
    event.respondWith(handleDynamicContent(request));
  }
});

// Check if request is to OpenAI API
function isOpenAIRequest(url) {
  return url.hostname === 'api.openai.com';
}

// Check if request is for static assets
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  const pathname = url.pathname.toLowerCase();
  return staticExtensions.some(ext => pathname.endsWith(ext)) || pathname.includes('fonts');
}

// Handle OpenAI API requests
async function handleOpenAIRequest(request) {
  try {
    // Always try network first for AI requests
    const response = await fetch(request);
    
    // Only cache successful responses that aren't error responses
    if (response.ok && response.status < 400) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      
      // Clone the response before caching (responses can only be consumed once)
      const responseClone = response.clone();
      
      // Add timestamp for cache expiration
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cached': Date.now().toString()
        }
      });
      
      await cache.put(request, responseWithTimestamp);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] OpenAI API request failed, checking cache:', error);
    
    // Try to serve from cache as fallback
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedTime = cachedResponse.headers.get('sw-cached');
      const isExpired = cachedTime && (Date.now() - parseInt(cachedTime)) > CACHE_DURATION.API;
      
      if (!isExpired) {
        console.log('[SW] Serving cached OpenAI response');
        return cachedResponse;
      }
    }
    
    // If no cache or expired, throw the original error
    throw error;
  }
}

// Handle static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Serve from cache and update in background
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  try {
    // Not in cache, fetch from network
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', error);
    
    // Return a basic fallback for critical files
    if (request.url.includes('index.html') || request.url.endsWith('/')) {
      return new Response(
        '<!DOCTYPE html><html><head><title>Becoming - Offline</title></head><body><h1>Becoming</h1><p>You are offline. Please check your connection.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    throw error;
  }
}

// Handle dynamic content (app shell, pages)
async function handleDynamicContent(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network request failed, checking cache:', error);
    
    // Try to serve from cache
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation requests, serve the cached index.html as SPA fallback
    if (request.mode === 'navigate') {
      const indexCache = await caches.open(STATIC_CACHE_NAME);
      const indexResponse = await indexCache.match('/index.html') || await indexCache.match('/');
      
      if (indexResponse) {
        return indexResponse;
      }
    }
    
    // If all else fails, return a minimal offline page
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Becoming - Offline</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            text-align: center; 
            padding: 50px; 
            background: #F8F9FA;
            color: #212529;
          }
          .container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #4ECDC4, #A8E6CF);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }
          h1 { color: #4ECDC4; margin-bottom: 10px; }
          p { color: #6C757D; line-height: 1.5; }
          button {
            background: #4ECDC4;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🌱</div>
          <h1>Becoming</h1>
          <p>You're currently offline. Your reflections are safely stored on your device.</p>
          <p>Please check your internet connection to sync with AI features.</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
      </html>`,
      { 
        headers: { 
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        } 
      }
    );
  }
}

// Update cache in background for static assets
async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
    }
  } catch (error) {
    // Silently fail background updates
    console.log('[SW] Background cache update failed:', error);
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_INVALIDATE':
      // Invalidate specific cache entries if needed
      invalidateCache(payload);
      break;
      
    case 'GET_CACHE_STATUS':
      // Send cache status back to main thread
      getCacheStatus().then(status => {
        event.ports[0]?.postMessage({ type: 'CACHE_STATUS', payload: status });
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Invalidate cache entries
async function invalidateCache(patterns = []) {
  try {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('becoming-')) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const shouldInvalidate = patterns.some(pattern => 
            request.url.includes(pattern)
          );
          
          if (shouldInvalidate) {
            await cache.delete(request);
          }
        }
      }
    }
  } catch (error) {
    console.error('[SW] Cache invalidation failed:', error);
  }
}

// Get cache status
async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const becomingCaches = cacheNames.filter(name => name.startsWith('becoming-'));
    
    const status = {
      caches: becomingCaches,
      version: CACHE_NAME,
      offline: !navigator.onLine
    };
    
    return status;
  } catch (error) {
    console.error('[SW] Failed to get cache status:', error);
    return { error: error.message };
  }
}

// Periodic cleanup of expired cache entries
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupExpiredCache());
  }
});

// Clean up expired cache entries
async function cleanupExpiredCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cachedTime = response.headers.get('sw-cached');
        if (cachedTime) {
          const age = Date.now() - parseInt(cachedTime);
          if (age > CACHE_DURATION.DYNAMIC) {
            await cache.delete(request);
          }
        }
      }
    }
    
    console.log('[SW] Expired cache entries cleaned up');
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}

console.log('[SW] Service worker script loaded');
