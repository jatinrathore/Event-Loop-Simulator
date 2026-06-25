"use client";

import { create } from "zustand";
import { v4 as uuid } from "uuid";

export type TimelineSource = "Simulator" | "Code Analyzer";

export interface TimelineEvent {
  id: string;
  timestamp: number;
  timeString: string;
  eventLabel: string;
  taskType?: "microtask" | "macrotask" | "system";
  taskLabel?: string;
  iteration?: number;
  details?: string;
}

export interface TimelineSession {
  id: string;
  source: TimelineSource;
  runNumber: number;
  timestamp: number;
  entries: TimelineEvent[];
}

interface TimelineHistoryState {
  sessions: TimelineSession[];
  activeSessionId: string | null;
  simulatorRunCount: number;
  analyzerRunCount: number;
}

interface TimelineHistoryActions {
  startSession: (source: TimelineSource) => void;
  addEvent: (event: Omit<TimelineEvent, "id" | "timeString" | "timestamp"> & { timestamp?: number }) => void;
  clearHistory: () => void;
}

export type TimelineHistoryStore = TimelineHistoryState & TimelineHistoryActions;

export const useTimelineHistoryStore = create<TimelineHistoryStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  simulatorRunCount: 0,
  analyzerRunCount: 0,

  startSession: (source) => {
    set((state) => {
      const runNumber = source === "Simulator" ? state.simulatorRunCount + 1 : state.analyzerRunCount + 1;
      const newSession: TimelineSession = {
        id: uuid(),
        source,
        runNumber,
        timestamp: Date.now(),
        entries: [],
      };
      
      return {
        sessions: [newSession, ...state.sessions], // Newest first
        activeSessionId: newSession.id,
        simulatorRunCount: source === "Simulator" ? runNumber : state.simulatorRunCount,
        analyzerRunCount: source === "Code Analyzer" ? runNumber : state.analyzerRunCount,
      };
    });
  },

  addEvent: (eventData) => {
    const state = get();
    if (!state.activeSessionId) return;

    const timestamp = eventData.timestamp || Date.now();
    const date = new Date(timestamp);
    const timeString = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}`;

    const newEvent: TimelineEvent = {
      id: uuid(),
      timestamp,
      timeString,
      ...eventData,
    };

    set((state) => {
      const updatedSessions = state.sessions.map((session) => {
        if (session.id === state.activeSessionId) {
          return {
            ...session,
            // Keep chronologically oldest first inside the session
            entries: [...session.entries, newEvent],
          };
        }
        return session;
      });
      return { sessions: updatedSessions };
    });
  },

  clearHistory: () => {
    set({ sessions: [], simulatorRunCount: 0, analyzerRunCount: 0, activeSessionId: null });
  },
}));
