import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY);

// Públicas: login, signup, y la API (tRPC valida su propia sesión en el context).
const isPublic = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/(.*)',
  '/__clerk/(.*)',
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
    // Todo menos estáticos de Next.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
