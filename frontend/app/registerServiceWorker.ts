// Registers the service worker for PWA support
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
          console.log('Service worker registered:', reg);
        })
        .catch(err => {
          console.error('Service worker registration failed:', err);
        });
    });
  }
}
