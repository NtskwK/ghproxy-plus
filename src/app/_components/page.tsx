"use client";
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
      <main className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <h1 className="text-4xl font-bold text-center">Hello World</h1>
      </main>
      <p>you click button {conter} times!</p>
      <button onClick={() => setCounter(conter + 1)}>click me!</button>
      <p>Message from API: {message}</p>
    </>
  );
}
