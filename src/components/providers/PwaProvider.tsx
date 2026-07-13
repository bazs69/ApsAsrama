"use client"
import { useEffect } from "react"

export default function PwaProvider() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            // Register exactly once per load
            const registerSW = async () => {
                try {
                    await navigator.serviceWorker.register("/sw.js");
                } catch (error) {
                    console.error("Service worker registration failed, error:", error);
                }
            }
            registerSW();
        }
    }, []);

    return null;
}
