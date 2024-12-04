// Service worker for PWA installability and image caching

const CACHE_NAME = 'cache-v1';
export const IMAGE_CACHE_URLS = [
  "/aggregate-black.jpg",
  "/aggregate.png",
  "/agg_logo_3.png",
  "/agg_logo_3_no_bg.png",
  "/cache_items.js",
  "/fonts/kroppen.ttf",
  "/images/0x.png",
  "/images/1inch.png",
  "/images/across.png",
  "/images/aggregate-1280x800.png",
  "/images/aggregate-750x1334.png",
  "/images/aggregate-black-192.png",
  "/images/aggregate-black-512.png",
  "/images/allbridge.png",
  "/images/balancer.png",
  "/images/bungee.png",
  "/images/debridge.png",
  "/images/deswap.png",
  "/images/discord.png",
  "/images/dododex.png",
  "/images/enso.png",
  "/images/gitbook.png",
  "/images/hop.png",
  "/images/hyperlane.png",
  "/images/hyphen.png",
  "/images/jumper.png",
  "/images/kana.png",
  "/images/koi.png",
  "/images/kyberswap.png",
  "/images/layerswap.png",
  "/images/lifi.png",
  "/images/memebridge.png",
  "/images/minibridge.png",
  "/images/native.png",
  "/images/nitro.png",
  "/images/odos.png",
  "/images/okx.png",
  "/images/openocean.png",
  "/images/orbiter.png",
  "/images/owlto.png",
  "/images/paraswap.png",
  "/images/rango.png",
  "/images/relay.png",
  "/images/rocket.png",
  "/images/settings.png",
  "/images/slingshot.png",
  "/images/squid.png",
  "/images/stargate.png",
  "/images/sushiswap.png",
  "/images/swagger.png",
  "/images/switch.png",
  "/images/symbiosis.png",
  "/images/synapse.png",
  "/images/syncswap.png",
  "/images/twitter.png",
  "/images/wowmax.png",
  "/images/xy.png",
  "/manifest.json",
  "/openApi/paths/approve.json",
  "/openApi/paths/chains.json",
  "/openApi/paths/dapps.json",
  "/openApi/paths/quote.json",
  "/openApi/paths/quote_direct.json",
  "/openApi/paths/tokens.json",
  "/openApi/paths/transaction.json",
  "/openapi.json",
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(IMAGE_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith(self.location.origin + '/images/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
        })
    );
  }
});