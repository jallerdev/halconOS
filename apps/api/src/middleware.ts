import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY);

// Públicas: login, signup, la API (tRPC valida su propia sesión en el context)
// y los archivos de metadata/crawlers (robots, sitemap, llms).
const isPublic = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/(.*)',
  '/__clerk/(.*)',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/llms-full.txt',
  '/opengraph-image(.*)',
  '/icon.svg',
]);

const handler = clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (isPublic(req)) return;
      const { userId } = await auth();
      if (!userId) {
        const signIn = new URL('/sign-in', req.url);
        signIn.searchParams.set('redirect_url', req.nextUrl.pathname);
        return NextResponse.redirect(signIn);
      }
    })
  : (_req: NextRequest) => NextResponse.next();

export default handler;

export const config = {
  matcher: [
    // Todo menos estáticos de Next y archivos de metadata (txt/xml).
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|txt|xml|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
