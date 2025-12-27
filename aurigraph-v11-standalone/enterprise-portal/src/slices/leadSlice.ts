/**
 * Redux Slice for Lead Management
 *
 * Manages lead state including:
 * - Lead list and detail view
 * - Lead status and scoring
 * - Lead filtering and search
 * - Loading and error states
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CrmService, Lead, LeadStatus, CreateLeadRequest } from '../services/CrmService';

interface LeadState {
  leads: Lead[];
  selectedLead: Lead | null;
  filteredLeads: Lead[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  searchQuery: string;
  filterStatus: LeadStatus | null;
}

const initialState: LeadState = {
  leads: [],
  selectedLead: null,
  filteredLeads: [],
  status: 'idle',
  error: null,
  searchQuery: '',
  filterStatus: null,
};

// Async thunks
export const fetchAllLeads = createAsyncThunk(
  'leads/fetchAllLeads',
  async (_, { rejectWithValue }) => {
    try {
      return await CrmService.getAllLeads();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch leads');
    }
  }
);

export const fetchLeadsByStatus = createAsyncThunk(
  'leads/fetchByStatus',
  async (status: LeadStatus, { rejectWithValue }) => {
    try {
      return await CrmService.getLeadsByStatus(status);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch leads by status');
    }
  }
);

export const fetchLeadById = createAsyncThunk(
  'leads/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await CrmService.getLead(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch lead');
    }
  }
);

export const fetchHighValueLeads = createAsyncThunk(
  'leads/fetchHighValue',
  async (minScore: number = 50, { rejectWithValue }) => {
    try {
      return await CrmService.getHighValueLeads(minScore);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch high-value leads');
    }
  }
);

export const fetchLeadsNeedingFollowUp = createAsyncThunk(
  'leads/fetchFollowUp',
  async (_, { rejectWithValue }) => {
    try {
      return await CrmService.getLeadsNeedingFollowUp();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch leads needing follow-up');
    }
  }
);

export const createLead = createAsyncThunk(
  'leads/create',
  async (request: CreateLeadRequest, { rejectWithValue }) => {
    try {
      return await CrmService.createLead(request);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create lead');
    }
  }
);

export const updateLeadStatus = createAsyncThunk(
  'leads/updateStatus',
  async ({ id, status }: { id: string; status: LeadStatus }, { rejectWithValue }) => {
    try {
      return await CrmService.updateLeadStatus(id, status);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update lead status');
    }
  }
);

export const updateLeadScore = createAsyncThunk(
  'leads/updateScore',
  async ({ id, score }: { id: string; score: number }, { rejectWithValue }) => {
    try {
      return await CrmService.updateLeadScore(id, score);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update lead score');
    }
  }
);

export const verifyLeadEmail = createAsyncThunk(
  'leads/verifyEmail',
  async (id: string, { rejectWithValue }) => {
    try {
      return await CrmService.verifyEmail(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to verify email');
    }
  }
);

export const assignLead = createAsyncThunk(
  'leads/assign',
  async ({ leadId, userId }: { leadId: string; userId: string }, { rejectWithValue }) => {
    try {
      return await CrmService.assignLead(leadId, userId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to assign lead');
    }
  }
);

// Slice
const leadSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      applyFilters(state);
    },
    setFilterStatus: (state, action: PayloadAction<LeadStatus | null>) => {
      state.filterStatus = action.payload;
      applyFilters(state);
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedLead: (state) => {
      state.selectedLead = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all leads
    builder
      .addCase(fetchAllLeads.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllLeads.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.leads = action.payload;
        applyFilters(state);
      })
      .addCase(fetchAllLeads.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Fetch by status
    builder
      .addCase(fetchLeadsByStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLeadsByStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.leads = action.payload;
        applyFilters(state);
      })
      .addCase(fetchLeadsByStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Fetch lead by ID
    builder
      .addCase(fetchLeadById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.selectedLead = action.payload;
      })
      .addCase(fetchLeadById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Fetch high-value leads
    builder
      .addCase(fetchHighValueLeads.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchHighValueLeads.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.leads = action.payload;
        applyFilters(state);
      })
      .addCase(fetchHighValueLeads.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Fetch leads needing follow-up
    builder
      .addCase(fetchLeadsNeedingFollowUp.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLeadsNeedingFollowUp.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.leads = action.payload;
        applyFilters(state);
      })
      .addCase(fetchLeadsNeedingFollowUp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Create lead
    builder
      .addCase(createLead.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.leads.unshift(action.payload);
        applyFilters(state);
      })
      .addCase(createLead.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Update status
    builder.addCase(updateLeadStatus.fulfilled, (state, action) => {
      const index = state.leads.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.leads[index] = action.payload;
      }
      if (state.selectedLead?.id === action.payload.id) {
        state.selectedLead = action.payload;
      }
      applyFilters(state);
    });

    // Update score
    builder.addCase(updateLeadScore.fulfilled, (state, action) => {
      const index = state.leads.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.leads[index] = action.payload;
      }
      if (state.selectedLead?.id === action.payload.id) {
        state.selectedLead = action.payload;
      }
      applyFilters(state);
    });

    // Verify email
    builder.addCase(verifyLeadEmail.fulfilled, (state, action) => {
      const index = state.leads.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.leads[index] = action.payload;
      }
      if (state.selectedLead?.id === action.payload.id) {
        state.selectedLead = action.payload;
      }
    });

    // Assign lead
    builder.addCase(assignLead.fulfilled, (state, action) => {
      const index = state.leads.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.leads[index] = action.payload;
      }
      if (state.selectedLead?.id === action.payload.id) {
        state.selectedLead = action.payload;
      }
    });
  },
});

// Helper function to apply search and status filters
function applyFilters(state: LeadState) {
  let filtered = state.leads;

  // Apply status filter
  if (state.filterStatus) {
    filtered = filtered.filter((lead) => lead.status === state.filterStatus);
  }

  // Apply search query (search by name, email, company)
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (lead) =>
        lead.firstName.toLowerCase().includes(query) ||
        lead.lastName.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.companyName.toLowerCase().includes(query)
    );
  }

  state.filteredLeads = filtered;
}

export default leadSlice.reducer;
export const { setSearchQuery, setFilterStatus, clearError, clearSelectedLead } =
  leadSlice.actions;
