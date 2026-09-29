import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Launcher } from "./launcher.tsx";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from index.html");

createRoot(root).render(
  <StrictMode>
    <Launcher />
  </StrictMode>,
);
