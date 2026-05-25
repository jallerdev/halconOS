import { router } from '../trpc';
import { inboundKeysRouter } from './inbound-keys';
import { leadsRouter } from './leads';
import { notesRouter } from './notes';
import { projectsRouter } from './projects';
import { tasksRouter } from './tasks';

export const appRouter = router({
  leads: leadsRouter,
  projects: projectsRouter,
  tasks: tasksRouter,
  notes: notesRouter,
  inboundKeys: inboundKeysRouter,
});

export type AppRouter = typeof appRouter;
