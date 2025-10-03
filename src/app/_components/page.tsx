"use client";
import React, { useState } from "react";

export default function HelloPage() {
  const [conter, setCounter] = useState(0);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <h1 className="text-4xl font-bold text-center">Hello World</h1>
      <p>you click button {conter} times!</p>
      <button onClick={() => setCounter(conter + 1)}>click me!</button>
    </main>
  );
}
