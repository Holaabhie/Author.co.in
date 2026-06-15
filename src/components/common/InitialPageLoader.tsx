"use client";

import { useEffect, useState } from "react";
import AuthorLoader from "./AuthorLoader";

export default function InitialPageLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return <AuthorLoader />;
}
