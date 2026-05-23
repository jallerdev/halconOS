import { Boxes } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ejecución de los leads ganados.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-20 text-center">
        <div className="rounded-full bg-secondary/50 p-3 text-muted-foreground">
          <Boxes className="size-6" />
        </div>
        <p className="mt-4 text-sm font-medium">Aún no hay proyectos</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Convierte un lead ganado para crear su primer proyecto.
        </p>
      </div>
    </div>
  );
}
