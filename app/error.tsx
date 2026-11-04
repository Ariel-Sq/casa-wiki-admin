'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="mb-3 text-3xl font-bold">Algo salió mal</h1>
        <p className="mb-8 text-muted-foreground">
          El panel no pudo mostrar esta página. Probá de nuevo; si sigue, avisanos.
        </p>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </main>
  );
}
