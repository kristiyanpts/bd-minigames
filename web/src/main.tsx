import React from "react";
import ReactDOM from "react-dom/client";
import { VisibilityProvider } from "./providers/VisibilityProvider";
import App from "./components/App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <VisibilityProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </VisibilityProvider>
);
