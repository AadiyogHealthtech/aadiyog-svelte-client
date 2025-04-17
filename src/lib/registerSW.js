import { dev } from '$app/environment';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Get the base URL of the current page
    const baseURL = window.location.origin;
    
    navigator.serviceWorker.register(`${baseURL}/worker.js`, {
      type: dev ? 'module' : 'classic',
      scope: '/'
    })
    .then(registration => {
      console.log('Service worker registered successfully:', registration.scope);
    })
    .catch(error => {
      console.error('Service worker registration failed:', error);
    });
  }
}