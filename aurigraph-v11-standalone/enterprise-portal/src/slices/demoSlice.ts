/**
 * Redux Slice for Demo Management
 *
 * Manages demo scheduling state including:
 * - Demo list and detail view
 * - Demo status tracking
 * - Demo scheduling workflows
 * - Demo feedback collection
 * - Loading and error states
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  CrmService,
  DemoRequest,
  DemoStatus,
  DemoType,
  DemoOutcome,
  ScheduleDemoRequest,
} from '../services/CrmService';

interface DemoState {
  demos: DemoRequest[];
  selectedDemo: DemoRequest | null;
  pendingDemos: DemoRequest[];
  todaysDemos: DemoRequest[];
  followUpDemos: DemoRequest[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  schedulingDemoId: string | null; // Track which demo is being scheduled
}

const initialState: DemoState = {
  demos: [],
  selectedDemo: null,
  pendingDemos: [],
  todaysDemos: [],
  followUpDemos: [],
  status: 'idle',
  error: null,
  schedulingDemoId: null,
};

// Async thunks
export const createDemoRequest = createAsyncThunk(
  'demos/create',
  async ({ leadId, demoType }: { leadId: string; demoType: DemoType }, { rejectWithValue }) => {
    try {
      return await CrmService.createDemo(leadId, demoType);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create demo');
    }
  }
);

export const scheduleDemoRequest = createAsyncThunk(
  'demos/schedule',
  async (
    { demoId, request }: { demoId: string; request: ScheduleDemoRequest },
    { rejectWithValue }
  ) => {
    try {
      await CrmService.scheduleDemo(demoId, request);
      // Fetch updated demo
      return demoId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to schedule demo');
    }
  }
);

export const createMeetingLink = createAsyncThunk(
  'demos/createMeeting',
  async (
    { demoId, platform }: { demoId: string; platform: string },
    { rejectWithValue }
  ) => {
    try {
      await CrmService.createMeetingLink(demoId, platform);
      return demoId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create meeting link');
    }
  }
);

export const sendCalendarInvite = createAsyncThunk(
  'demos/sendInvite',
  async (demoId: string, { rejectWithValue }) => {
    try {
      await CrmService.sendCalendarInvite(demoId);
      return demoId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send calendar invite');
    }
  }
);

export const completeDemoRequest = createAsyncThunk(
  'demos/complete',
  async (
    {
      demoId,
      recordingUrl,
      satisfaction,
      feedback,
      outcome,
    }: {
      demoId: string;
      recordingUrl: string;
      satisfaction: number;
      feedback: string;
      outcome: DemoOutcome;
    },
    { rejectWithValue }
  ) => {
    try {
      await CrmService.completeDemo(demoId, recordingUrl, satisfaction, feedback, outcome);
      return demoId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete demo');
    }
  }
);

export const fetchPendingDemos = createAsyncThunk(
  'demos/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      return await CrmService.getPendingDemos();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch pending demos');
    }
  }
);

export const fetchTodaysDemos = createAsyncThunk(
  'demos/fetchTodays',
  async (_, { rejectWithValue }) => {
    try {
      return await CrmService.getTodaysDemos();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch today\'s demos');
    }
  }
);

export const fetchDemosNeedingFollowUp = createAsyncThunk(
  'demos/fetchFollowUp',
  async (_, { rejectWithValue }) => {
    try {
      return await CrmService.getDemosNeedingFollowUp();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch demos needing follow-up');
    }
  }
);

export const cancelDemoRequest = createAsyncThunk(
  'demos/cancel',
  async ({ demoId, reason }: { demoId: string; reason: string }, { rejectWithValue }) => {
    try {
      await CrmService.cancelDemo(demoId, reason);
      return demoId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel demo');
    }
  }
);

export const sendReminder24h = createAsyncThunk(
  'demos/reminder24h',
  async (demoId: string, { rejectWithValue }) => {
    try {
      await CrmService.sendReminder24h(demoId);
      return demoId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send 24-hour reminder');
    }
  }
);

export const sendReminder1h = createAsyncThunk(
  'demos/reminder1h',
  async (demoId: string, { rejectWithValue }) => {
    try {
      await CrmService.sendReminder1h(demoId);
      return demoId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send 1-hour reminder');
    }
  }
);

// Slice
const demoSlice = createSlice({
  name: 'demos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedDemo: (state) => {
      state.selectedDemo = null;
    },
    setSchedulingDemoId: (state, action: PayloadAction<string | null>) => {
      state.schedulingDemoId = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Create demo
    builder
      .addCase(createDemoRequest.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createDemoRequest.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.demos.push(action.payload);
        state.pendingDemos.push(action.payload);
      })
      .addCase(createDemoRequest.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Schedule demo
    builder
      .addCase(scheduleDemoRequest.pending, (state, action) => {
        state.status = 'loading';
        state.schedulingDemoId = action.meta.arg.demoId;
      })
      .addCase(scheduleDemoRequest.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.schedulingDemoId = null;
        // Update demo status in local state
        const demoIndex = state.demos.findIndex((d) => d.id === action.payload);
        if (demoIndex !== -1) {
          state.demos[demoIndex].status = DemoStatus.SCHEDULED;
        }
      })
      .addCase(scheduleDemoRequest.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
        state.schedulingDemoId = null;
      });

    // Create meeting link
    builder
      .addCase(createMeetingLink.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createMeetingLink.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const demoIndex = state.demos.findIndex((d) => d.id === action.payload);
        if (demoIndex !== -1) {
          state.demos[demoIndex].status = DemoStatus.CONFIRMED;
        }
      })
      .addCase(createMeetingLink.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Send calendar invite
    builder
      .addCase(sendCalendarInvite.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(sendCalendarInvite.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const demoIndex = state.demos.findIndex((d) => d.id === action.payload);
        if (demoIndex !== -1) {
          state.demos[demoIndex].calendarInviteSent = true;
        }
      })
      .addCase(sendCalendarInvite.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Complete demo
    builder
      .addCase(completeDemoRequest.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(completeDemoRequest.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const demoIndex = state.demos.findIndex((d) => d.id === action.payload);
        if (demoIndex !== -1) {
          state.demos[demoIndex].status = DemoStatus.COMPLETED;
        }
      })
      .addCase(completeDemoRequest.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Fetch pending demos
    builder
      .addCase(fetchPendingDemos.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPendingDemos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.pendingDemos = action.payload;
      })
      .addCase(fetchPendingDemos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Fetch today's demos
    builder
      .addCase(fetchTodaysDemos.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTodaysDemos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.todaysDemos = action.payload;
      })
      .addCase(fetchTodaysDemos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Fetch demos needing follow-up
    builder
      .addCase(fetchDemosNeedingFollowUp.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDemosNeedingFollowUp.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.followUpDemos = action.payload;
      })
      .addCase(fetchDemosNeedingFollowUp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Cancel demo
    builder
      .addCase(cancelDemoRequest.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(cancelDemoRequest.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const demoIndex = state.demos.findIndex((d) => d.id === action.payload);
        if (demoIndex !== -1) {
          state.demos[demoIndex].status = DemoStatus.CANCELLED;
        }
      })
      .addCase(cancelDemoRequest.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    // Send reminders
    builder.addCase(sendReminder24h.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const demoIndex = state.demos.findIndex((d) => d.id === action.payload);
      if (demoIndex !== -1) {
        state.demos[demoIndex].reminder24hSent = true;
      }
    });

    builder.addCase(sendReminder1h.fulfilled, (state, action) => {
      state.status = 'succeeded';
      const demoIndex = state.demos.findIndex((d) => d.id === action.payload);
      if (demoIndex !== -1) {
        state.demos[demoIndex].reminder1hSent = true;
      }
    });
  },
});

export default demoSlice.reducer;
export const { clearError, clearSelectedDemo, setSchedulingDemoId } = demoSlice.actions;
