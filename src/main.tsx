
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Make sure we have a proper element to render into
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found");
  document.body.innerHTML = '<div id="root">Could not find root element</div>';
}

// Create React root and render app
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
