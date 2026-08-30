// Placeholder until P0-03 builds the app shell and P1-01 builds the real welcome screen.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-[40px] leading-none text-primary">Riff</h1>
      <p className="text-[15px] text-muted-foreground">Find your people. Play tonight.</p>
      <p className="mt-6 text-[12px] text-foreground-dim">
        Scaffold only — start at <span className="font-mono">P0-02</span> in{' '}
        <span className="font-mono">docs/BUILD-PLAN.md</span>.
      </p>
    </main>
  )
}
