import type { Metadata } from 'next';

import { SITE, SITE_URL } from '~/lib/site';
import { getLandingContent } from '../_landing/content';
import { Landing } from '../_landing/Landing';

const faqContent = getLandingContent('en').faq;

export const metadata: Metadata = {
  title: 'HalcónOS — AI sales CRM for agencies in LatAm',
  description:
    'Hunt leads with Google, write proposals with AI, and unify WhatsApp, email, and pipeline in one place. The sales CRM built for agencies.',
  alternates: {
    canonical: `${SITE_URL}/en`,
    languages: {
      'en-US': `${SITE_URL}/en`,
      'es-CO': `${SITE_URL}/`,
      'x-default': `${SITE_URL}/`,
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/en`,
    siteName: SITE.name,
    title: 'HalcónOS — AI sales CRM for agencies in LatAm',
    description:
      'Hunt leads with Google, write proposals with AI, and unify WhatsApp, email, and pipeline in one place.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HalcónOS — AI sales CRM for agencies',
    description:
      'Hunt leads with Google, write proposals with AI, and unify WhatsApp, email, and pipeline in one place.',
  },
};

const schemas = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/en#website`,
    url: `${SITE_URL}/en`,
    name: SITE.name,
    description:
      'AI-powered sales CRM for creative agencies, consultancies, and freelancers in LatAm.',
    inLanguage: 'en-US',
    publisher: { '@id': `${SITE_URL}/#organization` },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/en#software`,
    name: SITE.name,
    url: `${SITE_URL}/en`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'AI-powered sales CRM for creative agencies, consultancies, and freelancers in LatAm.',
    inLanguage: 'en-US',
    publisher: { '@id': `${SITE_URL}/#organization` },
    featureList: [
      'Lead hunting with Google Places',
      'AI-written proposals and messages',
      'Multichannel conversations (WhatsApp + email)',
      'Kanban pipeline with auto-scoring',
      'Signable proposals via public link',
      'One-tap conversion from lead to project',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Start free',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/en#faq`,
    inLanguage: 'en-US',
    mainEntity: faqContent.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  },
];

export default function HomeEn() {
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
      <Landing locale="en" />
    </>
  );
}
