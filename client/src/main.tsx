import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Apply dark theme by default
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA (if supported)
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').then((reg) => {
			// registration successful
		}).catch((err) => {
			// registration failed
			console.warn('Service worker registration failed:', err);
		});
	});
}
