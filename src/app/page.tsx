"use client";
import { useEffect, useState } from "react";

interface ApiResponse {
  message: string;
}

export default function Home() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/hello");
      const { message } = (await res.json()) as ApiResponse;
      setMessage(message);
    };
    fetchData();
  }, []);

  if (!message) return <p>Loading...</p>;

  return <p>{message}</p>;
}
