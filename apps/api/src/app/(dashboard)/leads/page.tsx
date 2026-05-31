import { PageHeader } from '~/components/page-header';
import { KpiCards } from './_components/KpiCards';
import { LeadsTable } from './_components/LeadsTable';

export default function LeadsPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8 px-6 py-8 lg:px-10">
      <PageHeader
        title="Leads"
        description="Tu pipeline de ventas · prospección, contacto y cierre."
      />
      <KpiCards />
      <LeadsTable />
    </div>
  );
}
