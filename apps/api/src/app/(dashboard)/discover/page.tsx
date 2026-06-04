'use client';

import { PageHeader } from '~/components/page-header';
import { ResultsGrid } from './_components/ResultsGrid';
import { SearchForm } from './_components/SearchForm';

// Tab Descubrir — busca negocios en Google Places por texto + ciudad y
// permite importarlos en bulk al CRM como leads NEW. Cache de 24h en DB para
// que búsquedas repetidas no gasten cuota de API.
export default function DiscoverPage() {
  return (
    <div className="hx-page mx-auto max-w-[1200px] space-y-6 px-6 py-8 lg:px-10">
      <PageHeader
        eyebrow="Caza tu próximo cliente"
        title="Descubrir"
        description="Busca negocios reales en Google Maps por texto y ciudad, y agrégalos a tu pipeline en un par de clics."
      />
      <SearchForm />
      <ResultsGrid />
    </div>
  );
}
