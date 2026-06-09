'use client';

import { PageHeader } from '~/components/page-header';
import { ResultsGrid } from './_components/ResultsGrid';
import { SearchForm } from './_components/SearchForm';
import { SearchHistory } from './_components/SearchHistory';

// Tab Descubrir — busca negocios y freelancers por texto + ciudad/país y
// permite importarlos al CRM. Cache 24h en DB para reusar resultados entre
// usuarios. Historial per-browser en localStorage para repetir búsquedas.
export default function DiscoverPage() {
  return (
    <div className="hx-page mx-auto max-w-[1200px] space-y-6 px-6 py-8 lg:px-10">
      <PageHeader
        eyebrow="Caza tu próximo cliente"
        title="Descubrir"
        description="Busca negocios reales por texto, ciudad y país, y agrégalos a tu pipeline en un par de clics."
        actions={<SearchHistory />}
      />
      <SearchForm />
      <ResultsGrid />
    </div>
  );
}
