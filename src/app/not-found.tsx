"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 w-full min-h-[60vh]">
      <h1 className="text-6xl font-bold">404</h1>
      <p>
        <span className="text-red-500 font-bold text-2xl">Oops!</span> The page
        you requested doesn't exist.
      </p>
      <Button onClick={() => router.push("/")}>Go Home</Button>
    </div>
  );
}
