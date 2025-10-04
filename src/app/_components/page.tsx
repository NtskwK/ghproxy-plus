import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2Icon } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ApiResponse {
  message: string;
}

export default function HelloPage() {
  const [conter, setCounter] = useState(0);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/hello");
      const { message } = (await res.json()) as ApiResponse;
      setMessage(message);
    };
    fetchData();
  }, []);

  return (
    <>
      <main className="min-h-screen flex flex-col items-center justify-center ">
        <h1 className="text-4xl font-bold text-center">Hello World</h1>
        <p>you click button {conter} times!</p>
        <Button onClick={() => setCounter(conter + 1)}>click me!</Button>
        <p>Message from API: {message}</p>
        <div className="grid w-full max-w-xl items-start gap-4">
          <Alert variant="destructive">
            <CheckCircle2Icon />
            <AlertTitle>Success! Your changes have been saved</AlertTitle>
            <AlertDescription>
              This is an alert with icon, title and description.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </>
  );
}
