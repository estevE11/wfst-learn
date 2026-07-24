import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ConceptProvider } from "./concepts/ConceptExplorer";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConceptProvider>
      <App />
    </ConceptProvider>
  </StrictMode>,
);
