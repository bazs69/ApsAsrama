// Basic Service Worker for PWA Installation

self.addEventListener("install", (event) => {
    console.log("[Service Worker] Installed");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[Service Worker] Activated");
});

self.addEventListener("fetch", (event) => {
    // A minimal fetch listener is required by some browsers to qualify as a PWA.
    // We're just passing the request through to the network here.
});
