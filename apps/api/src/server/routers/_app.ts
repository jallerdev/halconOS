import { router } from '../trpc';
import { discoverRouter } from './discover';
import { googleRouter } from './google';
import { inboundKeysRouter } from './inbound-keys';
import { leadsRouter } from './leads';
import { meetingsRouter } from './meetings';
import { notesRouter } from './notes';
import { projectsRouter } from './projects';
import { tasksRouter } from './tasks';

export const appRouter = router({
  leads: leadsRouter,
  projects: projectsRouter,
  tasks: tasksRouter,
  notes: notesRouter,
  inboundKeys: inboundKeysRouter,
  google: googleRouter,
  meetings: meetingsRouter,
  discover: discoverRouter,
});

export type AppRouter = typeof appRouter;
