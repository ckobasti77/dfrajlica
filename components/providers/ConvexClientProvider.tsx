"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useState, type ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

let warned = false;

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [client] = useState<ConvexReactClient | null>(() => {
    if (!convexUrl) {
      if (!warned) {
        warned = true;
        console.warn("NEXT_PUBLIC_CONVEX_URL is not set — rendering without Convex provider.");
      }
      return null;
    }
    return new ConvexReactClient(convexUrl);
  });

  if (!client) return <>{children}</>;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
