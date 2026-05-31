import { KpiCards } from './_components/KpiCards';
import { LeadsTable } from './_components/LeadsTable';

export default function LeadsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu pipeline de ventas · prospección, contacto y cierre.
        </p>
      </header>

      <div className="mb-6">
        <KpiCards />
      </div>

      <LeadsTable />
    </div>
  );
}
