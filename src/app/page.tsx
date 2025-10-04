"use client";

import { Suspense } from "react";
import HelloPage from "../components/page";

function HelloPageWrapper() {
  return <HelloPage />;
}

export default function Home() {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <HelloPageWrapper />
      </Suspense>
    </>
  );
}
