import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance optimization: Use concurrent features
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = createRoot(rootElement);

// Render with performance optimizations
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Enable performance monitoring in development
if (import.meta.env.DEV) {
  // Optional: Add performance monitoring
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        console.log('Page load time:', entry.duration);
      }
    }
  });
  observer.observe({ entryTypes: ['navigation'] });
}
