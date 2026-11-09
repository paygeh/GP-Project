"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Submit button that shows "Saving…" while the form action runs and a brief
 * "✓ Saved" confirmation once it completes. Drop-in replacement for a plain
 * <button> inside a server-action <form> — no change to the action needed.
 */
export function SaveButton({
  children,
  className,
  savedLabel = "Saved",
}: {
  children: React.ReactNode;
  className?: string;
  savedLabel?: string;
}) {
  const { pending } = useFormStatus();
  const [showSaved, setShowSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2500);
      wasPending.current = pending;
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <span className="inline-flex items-center gap-2.5">
      <button type="submit" disabled={pending} className={className}>
        {pending ? "Saving…" : children}
      </button>
      {showSaved && (
        <span className="animate-fade-in inline-flex items-center gap-1 text-sm font-medium text-green-600">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {savedLabel}
        </span>
      )}
    </span>
  );
}
