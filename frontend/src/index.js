import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./auth";
import App from "./App";
import "./index.css";

// Remove global navigation buttons that shouldn't be there
const removeGlobalNavButtons = () => {
  // Find and remove buttons with "Direct" or "Sign out" text
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    const text = button.textContent || button.innerText || '';
    if (text.includes('Direct') || text.includes('Sign out')) {
      button.style.display = 'none';
      button.remove();
    }
  });
  
  // Also check for buttons in navigation areas
  const navs = document.querySelectorAll('nav, [class*="nav"], [class*="header"]');
  navs.forEach(nav => {
    const navButtons = nav.querySelectorAll('button');
    navButtons.forEach(button => {
      const text = button.textContent || button.innerText || '';
      if (text.includes('Direct') || text.includes('Sign out')) {
        button.style.display = 'none';
        button.remove();
      }
    });
  });
};

// Run on DOM content loaded
document.addEventListener('DOMContentLoaded', removeGlobalNavButtons);

// Run periodically to catch dynamically added buttons
setInterval(removeGlobalNavButtons, 1000);

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
