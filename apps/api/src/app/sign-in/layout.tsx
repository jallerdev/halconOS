import type { ReactNode } from 'react';

import { ClerkArea } from '~/components/clerk-area';

export default function SignInLayout({ children }: { children: ReactNode }) {
  return <ClerkArea>{children}</ClerkArea>;
}
