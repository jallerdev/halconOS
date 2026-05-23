import { KanbanBoard } from './_components/KanbanBoard';

export default function PipelinePage() {
  return (
    <div className="px-6 py-8 lg:px-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arrastra leads entre etapas. Top 25 por score en cada columna.
        </p>
      </header>
      <KanbanBoard />
    </div>
  );
}
