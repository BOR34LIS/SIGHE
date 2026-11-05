"use client";

import { useState, useTransition } from "react";
import { regenerateJoinCode } from "./actions";

export function JoinCodeCard({ initialJoinCode }: { initialJoinCode: string }) {
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function regenerate() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateJoinCode();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.joinCode) setJoinCode(result.joinCode);
    });
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div>
        <h2 className="font-semibold text-text">Código de la empresa</h2>
        <p className="text-sm text-text-muted">
          Compártelo con quien solo necesite reportar equipos (no trabajar en el mapa/inventario):
          en <span className="font-medium text-text">/signup</span>, eligiendo{" "}
          <span className="font-medium text-text">&quot;Unirme con código&quot;</span>, queda como
          usuario de esta empresa y de ninguna otra.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-center font-mono text-lg tracking-widest text-text">
          {joinCode}
        </span>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(joinCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="h-11 shrink-0 rounded-lg border border-border px-3 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
        >
          {copied ? "Copiado ✓" : "Copiar"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={regenerate}
        disabled={isPending}
        className="self-start text-sm font-medium text-text-muted transition-colors hover:text-text disabled:opacity-60"
      >
        {isPending ? "Regenerando..." : "Regenerar código (invalida el actual)"}
      </button>
    </div>
  );
}
