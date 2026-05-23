import { router } from '../trpc';
import { leadsRouter } from './leads';
import { notesRouter } from './notes';
import { projectsRouter } from './projects';
import { tasksRouter } from './tasks';

export const appRouter = router({
  leads: leadsRouter,
  projects: projectsRouter,
  tasks: tasksRouter,
  notes: notesRouter,
});

export type AppRouter = typeof appRouter;
