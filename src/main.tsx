import { BrowserRouter } from "react-router-dom";

import "./globals.css";

import { Suspense } from "react";
import { Toaster } from "sonner";
import Footer from "./components/footer";
import Header from "./components/header";
import Homepage from "./pages";

export function Main() {
    return (
        <div className="font-sans antialiased min-h-screen flex flex-col bg-background">
            <Header />
            <BrowserRouter>
                <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-6 flex flex-col items-center justify-center gap-6 space-y-4">
                    <Toaster position="top-center" />
                    <Suspense fallback={<div>Loading...</div>}>
                        <Homepage />
                    </Suspense>
                </main>
            </BrowserRouter>
            <Footer />
        </div>
    );
}
