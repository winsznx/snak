export default function PlayLoading() {
  return (
    <main className="app-shell relative overflow-hidden bg-void">
      <div className="container-page py-20">
        <div className="grid place-items-center gap-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan">
            booting arena
          </div>
          <div className="aspect-square w-full max-w-[480px] animate-pulse rounded-md border border-cyan/20 bg-carbon" />
          <div className="grid w-full max-w-[480px] grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded border border-cyan/20 bg-carbon" />
            <div className="h-20 animate-pulse rounded border border-cyan/20 bg-carbon" />
          </div>
        </div>
      </div>
    </main>
  );
}
