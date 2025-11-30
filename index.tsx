import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// لاگ برای اطمینان از اجرای فایل ورودی
console.log("✅ Index.tsx loaded successfully. Attempting to mount App...");

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("❌ FATAL ERROR: Could not find element with id 'root' in index.html");
  document.body.innerHTML = "<h1 style='color:red; padding: 20px;'>Error: 'root' element missing in index.html</h1>";
} else {
  console.log("✅ Root element found. Rendering React App...");
  
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ React Mount command sent.");
  } catch (error) {
    console.error("❌ Error during React mount:", error);
    rootElement.innerHTML = `<h1 style='color:red'>Crash during render: ${error}</h1>`;
  }
}
