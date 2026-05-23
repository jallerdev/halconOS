import { create } from 'zustand';

import type { LeadStatus } from '@agency-os/shared/enums';

type State = {
  statusFilter: LeadStatus | 'ALL';
  search: string;
  setStatusFilter: (s: LeadStatus | 'ALL') => void;
  setSearch: (s: string) => void;
};

export const useLeadsUI = create<State>((set) => ({
  statusFilter: 'ALL',
  search: '',
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearch: (search) => set({ search }),
}));
