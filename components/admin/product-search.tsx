'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';

const DEBOUNCE_MS = 350;

/**
 * Live search for the product table: types → debounced navigation → the
 * server component re-renders with the new `?q=`. Enter still works (the form
 * submits immediately) and clearing the field restores the full list.
 */
export function ProductSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync when the URL changes from the outside (back
  // button, pagination, or a server-side redirect).
  const [synced, setSynced] = useState(initialQuery);
  if (initialQuery !== synced) {
    setSynced(initialQuery);
    setValue(initialQuery);
  }

  const navigate = (query: string) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/?${qs}` : '/', { scroll: false });
    });
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const typed = value.trim();
    if (typed === synced.trim()) return;

    timer.current = setTimeout(() => navigate(typed), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // navigate is stable enough for this debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, synced]);

  return (
    <form
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        navigate(value);
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar por nombre o slug"
        aria-label="Buscar productos"
        autoComplete="off"
        className="w-64 rounded-lg border bg-background py-2 pl-9 pr-8 text-sm"
      />
      {pending && (
        <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
    </form>
  );
}
