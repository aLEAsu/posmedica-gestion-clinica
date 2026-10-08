import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { ProveedorAviso } from "./components/Aviso";
import { ProveedorSesion } from "./sesion";
import "./styles/portal.css";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorAviso>
        <ProveedorSesion>
          <App />
        </ProveedorSesion>
      </ProveedorAviso>
    </BrowserRouter>
  </StrictMode>,
);
