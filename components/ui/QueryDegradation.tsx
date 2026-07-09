export function QueryDegradation({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  const unique = [...new Set(errors)];
  return (
    <details className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
      <summary className="cursor-pointer">
        {unique.length} consulta(s) degradada(s) — dados parciais (validar
        schema com credenciais reais)
      </summary>
      <ul className="mt-2 list-inside list-disc space-y-1 font-mono">
        {unique.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </details>
  );
}
