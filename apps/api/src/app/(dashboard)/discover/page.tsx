'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { PageHeader } from '~/components/page-header';
import { ResultsGrid } from './_components/ResultsGrid';
import { SearchForm } from './_components/SearchForm';
import { SearchHistory } from './_components/SearchHistory';

// Tab Descubrir — busca negocios y freelancers por texto + ciudad/país y
// permite importarlos al CRM. Cache 24h en DB para reusar resultados entre
// usuarios. Historial per-browser en localStorage para repetir búsquedas.
export default function DiscoverPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Restore al volver de otra tab: si la URL viene vacía, recuperamos los
  // últimos params de sessionStorage. El ref evita carrera con el save.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    if (typeof window === 'undefined') return;
    if (searchParams.toString()) {
      hydrated.current = true;
      return;
    }
    const saved = sessionStorage.getItem('halcon:discover:lastFilters');
    if (saved) {
      router.replace(`${pathname}?${saved}`, { scroll: false });
      return;
    }
    hydrated.current = true;
  }, [searchParams, router, pathname]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (typeof window === 'undefined') return;
    const str = searchParams.toString();
    if (str) sessionStorage.setItem('halcon:discover:lastFilters', str);
    else sessionStorage.removeItem('halcon:discover:lastFilters');
  }, [searchParams]);

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
