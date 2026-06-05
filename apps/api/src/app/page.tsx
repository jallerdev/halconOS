import { SITE, SITE_URL } from '~/lib/site';
import { FAQ } from './_landing/faq';
import { Landing } from './_landing/Landing';

const schemas = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE.publisher.name,
    url: SITE.publisher.url,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE.name,
    description: SITE.description,
    inLanguage: 'es-CO',
    publisher: { '@id': `${SITE_URL}/#organization` },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: SITE.name,
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: SITE.description,
    inLanguage: 'es-CO',
    publisher: { '@id': `${SITE_URL}/#organization` },
    featureList: [
      'Caza de leads con Google Places',
      'Propuestas y mensajes con IA',
      'Conversación multicanal (WhatsApp y email)',
      'Pipeline Kanban con auto-scoring',
      'Propuestas firmables con link público',
      'Conversión de lead a proyecto en un tap',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Empezar gratis',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  },
];

export default function Home() {
  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema['@id']}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Landing />
    </>
  );
}
