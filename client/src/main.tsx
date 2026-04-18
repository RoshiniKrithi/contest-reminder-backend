import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("Main.tsx executing...");

try {
    const root = createRoot(document.getElementById("root")!);
    root.render(<App />);
    console.log("Root rendered.");
    console.log("Root rendered.");
} catch (err) {
    console.error("Failed to mount root:", err);
    document.body.innerHTML = `<h1 style="color:red">CRITICAL MOUNT ERROR: ${err}</h1>`;
}

