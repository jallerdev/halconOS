import type { ReactNode } from 'react';

import { ClerkArea } from '~/components/clerk-area';

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return <ClerkArea>{children}</ClerkArea>;
}
