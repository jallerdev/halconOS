import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SITE, SITE_URL } from '~/lib/site';
import { BlogShell } from '../_components/BlogShell';
import { findPost, POSTS } from '../posts';
import { ConseguirClientesPost } from './_posts/conseguir-clientes';
import { ErroresGoogleMapsPost } from './_posts/errores-google-maps';
import { PropuestaComercialPost } from './_posts/propuesta-comercial';

// Static params para SSG completa: cada post se prerenderiza al build.
export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return { title: 'No encontrado' };
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author.name],
      tags: post.keywords,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

// Cada post tiene su componente con el contenido — switch por slug. Esto
// permite que el contenido sea full JSX (tablas, callouts, links) sin
// dependencia de un parser de markdown.
const CONTENT_BY_SLUG: Record<string, () => React.JSX.Element> = {
  'como-conseguir-clientes-agencia-marketing': ConseguirClientesPost,
  'errores-comunes-leads-google-maps': ErroresGoogleMapsPost,
  'plantilla-propuesta-comercial-agencia': PropuestaComercialPost,
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();
  const Content = CONTENT_BY_SLUG[post.slug];
  if (!Content) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: post.title,
    description: post.description,
    inLanguage: 'es',
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { '@type': 'Organization', name: post.author.name, url: post.author.url },
    publisher: { '@id': `${SITE_URL}/#organization` },
    keywords: post.keywords.join(', '),
    articleSection: post.category,
    wordCount: post.readingMinutes * 250,
    isPartOf: { '@id': `${SITE_URL}/blog#blog` },
    image: `${SITE_URL}/opengraph-image`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE.name, item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogShell post={post}>
        <Content />
      </BlogShell>
    </>
  );
}
