import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ModeToggle } from "./components/mode-toggle.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="font-mono">
                <nav className="absolute top-0 left-0 w-full flex justify-center">
                    <div className="flex items-center justify-between w-full max-w-7xl p-4">
                        <h4 className="font-bold tracking-widest text-sm">MISTRAL CHAT</h4>
                        <ModeToggle />
                    </div>
                </nav>
            </div>
            <App />
            <Toaster />
        </ThemeProvider>
    </React.StrictMode>,
);
