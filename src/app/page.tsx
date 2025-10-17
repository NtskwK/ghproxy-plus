"use client";
import { Suspense } from "react";
import HomePage from "@/components/pages/index";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <>
      <main className="flex-1 container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-6 flex flex-col items-center justify-center gap-6 space-y-4">
        <Toaster position="top-center" />
        <Suspense fallback={<div>Loading...</div>}>
          <HomePage />
        </Suspense>
      </main>
    </>
  );
}
