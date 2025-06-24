import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { BrowserCompatibilityProvider } from "./context/browserCompat.tsx";
import { DarkModeProvider } from "./context/DarkModeContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <BrowserCompatibilityProvider>
        <DarkModeProvider>
          <App />
        </DarkModeProvider>
      </BrowserCompatibilityProvider>
    </BrowserRouter>
  </StrictMode>
);
