import { dev } from '$app/environment';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/worker.js', {
      type: dev ? 'module' : 'classic'
    })
    .then(registration => {
      console.log('Service worker registered successfully:', registration.scope);
    })
    .catch(error => {
      console.error('Service worker registration failed:', error);
    });
  }
}