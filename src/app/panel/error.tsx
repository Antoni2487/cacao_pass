"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPanel({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-error-700/20 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold">Algo salió mal</h2>
      <p className="mt-2 text-sm text-tenue">{error.message}</p>
      <Button className="mt-6" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
