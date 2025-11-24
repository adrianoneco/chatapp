import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Unregister any service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log('[ServiceWorker] Unregistered old service worker');
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
