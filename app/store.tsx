"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export type Screen =
  | "login"
  | "agreement"
  | "dashboard"
  | "rx"
  | "duty"
  | "caselog"
  | "search"
  | "feedback"
  | "admin"
  | "notifications"
  | "resetpassword";

export type AuthMode = "signin" | "signup";
export type Role = "Employee" | "Student";
export type ChatMode = "interaction" | "question";
export type Severity = "None" | "Minor" | "Moderate" | "Major";
export type PatientPreg = "Not pregnant" | "Pregnant" | "Breastfeeding";

export interface Case {
  id: string;
  date: string;      // formatted "28 Jun 2025"
  time: string;      // formatted "20:00"
  createdAt: string; // ISO timestamp for date math
  meds: string;
  severity: Severity;
  drp: boolean;
  flagged: boolean;
  counsel: string;
  source: "Rx" | "Manual";
  countOnly: boolean;
}

export interface UserRow {
  id: string;
  fullName: string;
  role: string;
  joinedAt: string;
  lastSeenAt: string | null;
}

export interface FeedbackItem {
  id: string;
  userName: string;
  userRole: string;
  category: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Shift {
  id: string;
  type: "day" | "on-call";
  clockedInAt: string;   // ISO timestamp
  clockedOutAt: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: ChatMode;
  severity?: Severity;
  patientContext?: string;
  counselling?: string[];
  keyPoints?: string[];
  /** Real FDA DailyMed source links returned by the edge function */
  fdaSources?: { name: string; url: string }[];
  /** True when the response was grounded in live FDA label data */
  fdaDataFound?: boolean;
  thinking?: boolean;
}

export interface AppState {
  screen: Screen;
  authMode: AuthMode;
  role: Role;
  isAdmin: boolean;
  termsChecked: boolean;
  userName: string;
  userEmail: string;
  authError: string;
  authLoading: boolean;
  supabaseUser: User | null;
  avatarUrl: string | null;
  avatarUploading: boolean;

  // Rx
  chatMode: ChatMode;
  isThinking: boolean;
  patientSex: "Male" | "Female";
  patientAge: string;
  patientPreg: PatientPreg;
  patientDiseases: string[];
  patientAllergies: string[];
  messages: ChatMessage[];
  historyList: { id: string; label: string; mode: ChatMode }[];
  activeHistoryId: string;

  // Duty
  clockedIn: boolean;
  clockInTime: string | null;   // ISO timestamp of the active shift start
  activeShiftId: string | null;
  shifts: Shift[];
  shiftsLoading: boolean;
  viewYear: number;
  viewMonth: number; // 0-11
  dayShiftStart: string;   // default "08:00"
  dayShiftEnd: string;     // default "15:00"
  onCallOpen: boolean;
  onCallDate: string;      // "YYYY-MM-DD"
  onCallStart: string;     // "HH:MM"
  onCallEnd: string;       // "HH:MM"

  // Case log
  cases: Case[];
  casesLoading: boolean;
  addOpen: boolean;
  addMeds: string;
  addSev: Severity;
  addDrp: boolean;

  // Follow-up
  resolvedIds: string[];

  // UI
  notifOpen: boolean;
  toastOn: boolean;
  toastMsg: string;

  // Search
  selectedDrug: string | null;

  // Admin
  userRows: UserRow[];
  usersLoading: boolean;

  // Feedback
  feedbackItems: FeedbackItem[];
  unreadFeedbackCount: number;
}

const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Warfarin + Aspirin 100mg — patient is 64 y, male, hypertension, penicillin allergy",
    mode: "interaction",
  },
  {
    id: "m2",
    role: "assistant",
    content: "Concurrent use of warfarin and aspirin significantly increases the risk of major bleeding events, including gastrointestinal haemorrhage and intracranial bleeding. Aspirin inhibits platelet aggregation and may displace warfarin from plasma proteins, potentiating anticoagulant effect.",
    mode: "interaction",
    severity: "Major",
    patientContext: "assessed for 64 y · male · hypertension · allergy: penicillin",
    counselling: [
      "Monitor INR frequently — target may need adjustment.",
      "Watch for signs of bleeding: unusual bruising, blood in urine/stool, prolonged bleeding from cuts.",
      "Advise patient to avoid NSAIDs unless prescribed.",
      "Consult prescriber before adding or stopping any medication.",
    ],
    fdaSources: [
      { name: "Warfarin (Coumadin)", url: "https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=warfarin" },
      { name: "Aspirin", url: "https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=aspirin" },
    ],
    fdaDataFound: true,
  },
];

const initialState: AppState = {
  screen: "login",
  authMode: "signin",
  role: "Employee",
  isAdmin: false,
  termsChecked: false,
  userName: "",
  userEmail: "",
  authError: "",
  authLoading: false,
  supabaseUser: null,
  avatarUrl: null,
  avatarUploading: false,

  chatMode: "interaction",
  isThinking: false,
  patientSex: "Male",
  patientAge: "64",
  patientPreg: "Not pregnant",
  patientDiseases: ["Hypertension"],
  patientAllergies: ["Penicillin"],
  messages: initialMessages,
  historyList: [
    { id: "h1", label: "Warfarin + Aspirin", mode: "interaction" },
    { id: "h2", label: "Metformin + Ibuprofen", mode: "interaction" },
    { id: "h3", label: "Drug interactions in pregnancy", mode: "question" },
  ],
  activeHistoryId: "h1",

  clockedIn: false,
  clockInTime: null,
  activeShiftId: null,
  shifts: [],
  shiftsLoading: false,
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  dayShiftStart: "08:00",
  dayShiftEnd: "15:00",
  onCallOpen: false,
  onCallDate: "",
  onCallStart: "20:00",
  onCallEnd: "03:00",

  cases: [],
  casesLoading: false,
  addOpen: false,
  addMeds: "",
  addSev: "None",
  addDrp: false,

  resolvedIds: [],

  notifOpen: false,
  toastOn: false,
  toastMsg: "",

  selectedDrug: null,

  userRows: [],
  usersLoading: false,

  feedbackItems: [],
  unreadFeedbackCount: 0,
};

interface AppContextType {
  state: AppState;
  set: (partial: Partial<AppState>) => void;
  showToast: (msg: string) => void;
  navigate: (screen: Screen) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: Role) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  fetchCases: () => Promise<void>;
  addCase: (c: Omit<Case, "id" | "date" | "time" | "createdAt">) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  fetchShifts: (year: number, month: number) => Promise<void>;
  clockIn: () => Promise<void>;
  clockOut: (shiftId: string) => Promise<void>;
  addOnCallShift: (dateStr: string, startTime: string, endTime: string) => Promise<void>;
  submitFeedback: (category: string, message: string) => Promise<void>;
  fetchFeedback: () => Promise<void>;
  markFeedbackRead: (id: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const supabase = createClient();

  const set = (partial: Partial<AppState>) =>
    setState((s) => ({ ...s, ...partial }));

  const showToast = (msg: string) => {
    set({ toastOn: true, toastMsg: msg });
    setTimeout(() => set({ toastOn: false, toastMsg: "" }), 2700);
  };

  const navigate = (screen: Screen) => {
    setState((s) => {
      // Only admins can navigate to the admin screen
      if (screen === "admin" && !s.isAdmin) return s;
      return { ...s, screen, notifOpen: false };
    });
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, full_name, role, is_admin")
      .eq("id", userId)
      .single();
    if (data) {
      set({
        avatarUrl: data.avatar_url || null,
        userName: data.full_name || "",
        role: data.role || "Employee",
        isAdmin: data.is_admin === true,
      });
    }
    // Stamp last_seen_at so admin can track active users
    await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
  };

  // Restore session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        set({
          supabaseUser: session.user,
          userName: session.user.user_metadata?.full_name || session.user.email || "",
          userEmail: session.user.email || "",
          // role is never read from user-editable JWT metadata — fetchProfile reads it from DB
          screen: "agreement",
        });
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // User followed a password-reset link — show the new-password form
      if (_event === "PASSWORD_RECOVERY") {
        set({ screen: "resetpassword" });
        return;
      }
      if (session?.user) {
        set({
          supabaseUser: session.user,
          userName: session.user.user_metadata?.full_name || session.user.email || "",
          userEmail: session.user.email || "",
          // role is never read from user-editable JWT metadata — fetchProfile reads it from DB
        });
        // Always fetch the profile so is_admin (and avatar) are loaded on every sign-in
        fetchProfile(session.user.id);
      } else {
        set({ supabaseUser: null, userName: "", userEmail: "", screen: "login" });
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    set({ authLoading: true, authError: "" });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Normalize error — never expose raw Supabase messages (prevents user enumeration)
      set({ authLoading: false, authError: "Invalid email or password. Please try again." });
    } else {
      if (data.user) {
        // Fetch profile (including is_admin) before navigating so the sidebar renders correctly
        await fetchProfile(data.user.id);
        // Audit log — fire-and-forget, must not block the sign-in flow
        supabase.from("audit_log").insert({ user_id: data.user.id, event: "sign_in" });
      }
      set({ authLoading: false, screen: "agreement" });
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: Role) => {
    set({ authLoading: true, authError: "" });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) {
      // Normalize error — never expose raw Supabase messages
      const msg = error.message.toLowerCase();
      const friendly =
        msg.includes("already registered") || msg.includes("already exists")
          ? "An account with this email already exists."
          : "Could not create account. Please try again.";
      set({ authLoading: false, authError: friendly });
    } else {
      if (data.user) {
        supabase.from("audit_log").insert({ user_id: data.user.id, event: "sign_up" });
      }
      set({ authLoading: false, screen: "agreement" });
    }
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== "undefined" ? window.location.origin : "https://pillr-kohl.vercel.app",
    });
    if (error) throw new Error("Could not send reset email. Please try again.");
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error("Could not update password. Please try again.");
  };

  const signOut = async () => {
    // Audit log before clearing the session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      supabase.from("audit_log").insert({ user_id: session.user.id, event: "sign_out" });
    }
    await supabase.auth.signOut();
    set({ ...initialState });
  };

  const fetchCases = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    set({ casesLoading: true });
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      const mapped: Case[] = data.map((r) => ({
        id: r.id,
        date: new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        time: new Date(r.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        createdAt: r.created_at,
        meds: r.medications || "",
        severity: r.severity as Severity,
        drp: r.drp,
        flagged: r.flagged,
        counsel: r.counselling || "",
        source: r.source as "Rx" | "Manual",
        countOnly: r.count_only,
      }));
      set({ cases: mapped });
    }
    set({ casesLoading: false });
  };

  const uploadAvatar = async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Client-side MIME and size guard (Supabase Storage bucket policy is the server-side enforcer)
    const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (!ALLOWED_MIME.has(file.type)) {
      showToast("Only JPEG, PNG, WebP, and GIF images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be smaller than 5 MB");
      return;
    }

    set({ avatarUploading: true });
    const ext = file.name.split(".").pop();
    const path = `${session.user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      set({ avatarUploading: false });
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);
    // Cache-bust so the browser picks up the new image immediately
    const urlWithBust = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: urlWithBust }).eq("id", session.user.id);
    set({ avatarUrl: urlWithBust, avatarUploading: false });
  };

  const addCase = async (c: Omit<Case, "id" | "date" | "time" | "createdAt">) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase.from("cases").insert({
      user_id: session.user.id,
      medications: c.meds,
      severity: c.severity,
      drp: c.drp,
      flagged: c.flagged,
      counselling: c.counsel,
      source: c.source,
      count_only: c.countOnly,
    }).select().single();
    if (!error && data) {
      const newCase: Case = {
        id: data.id,
        date: new Date(data.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        time: new Date(data.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        createdAt: data.created_at,
        meds: data.medications || "",
        severity: data.severity,
        drp: data.drp,
        flagged: data.flagged,
        counsel: data.counselling || "",
        source: data.source,
        countOnly: data.count_only,
      };
      set({ cases: [newCase, ...state.cases] });
    }
  };

  const fetchShifts = async (year: number, month: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const start = new Date(year, month, 1).toISOString();
    const end   = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
    const { data } = await supabase
      .from("shifts")
      .select("*")
      .gte("clocked_in_at", start)
      .lte("clocked_in_at", end)
      .order("clocked_in_at");
    if (data) {
      const mapped: Shift[] = data.map((r) => ({
        id: r.id,
        type: r.type as "day" | "on-call",
        clockedInAt: r.clocked_in_at,
        clockedOutAt: r.clocked_out_at || null,
      }));
      const openShift = mapped.find((s) => !s.clockedOutAt);
      setState((s) => ({
        ...s,
        shifts: mapped,
        clockedIn: !!openShift,
        activeShiftId: openShift?.id || null,
        clockInTime: openShift?.clockedInAt || null,
      }));
    }
  };

  const clockIn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase.from("shifts").insert({
      user_id: session.user.id,
      type: "day",
    }).select().single();
    if (!error && data) {
      const newShift: Shift = {
        id: data.id, type: "day",
        clockedInAt: data.clocked_in_at, clockedOutAt: null,
      };
      setState((s) => ({
        ...s,
        clockedIn: true,
        activeShiftId: data.id,
        clockInTime: data.clocked_in_at,
        shifts: [...s.shifts, newShift],
      }));
    }
  };

  const clockOut = async (shiftId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("shifts")
      .update({ clocked_out_at: now })
      .eq("id", shiftId)
      .eq("user_id", session.user.id);   // IDOR fix: only update own shifts
    if (!error) {
      setState((s) => ({
        ...s,
        clockedIn: false,
        activeShiftId: null,
        clockInTime: null,
        shifts: s.shifts.map((sh) => sh.id === shiftId ? { ...sh, clockedOutAt: now } : sh),
      }));
    }
  };

  const addOnCallShift = async (dateStr: string, startTime: string, endTime: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated — please sign in again.");

    // Use local datetime strings so JS parses as local time, not UTC.
    // "2025-06-28T20:00:00" (no Z suffix) → local midnight-based arithmetic.
    const clockedInAt  = new Date(`${dateStr}T${startTime}:00`);
    const clockedOutAt = new Date(`${dateStr}T${endTime}:00`);

    // Overnight shift: if end ≤ start push end to next calendar day
    if (clockedOutAt <= clockedInAt) {
      clockedOutAt.setDate(clockedOutAt.getDate() + 1);
    }

    const { data, error } = await supabase.from("shifts").insert({
      user_id:        session.user.id,
      type:           "on-call",
      clocked_in_at:  clockedInAt.toISOString(),
      clocked_out_at: clockedOutAt.toISOString(),
    }).select().single();

    if (error) throw new Error(error.message);

    if (data) {
      setState((s) => ({
        ...s,
        shifts: [...s.shifts, {
          id:           data.id,
          type:         "on-call" as const,
          clockedInAt:  data.clocked_in_at,
          clockedOutAt: data.clocked_out_at,
        }],
        onCallOpen: false,
      }));
    }
  };

  const fetchUsers = async () => {
    // Server-side admin guard — verify from DB, not client state
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: adminCheck } = await supabase
      .from("profiles").select("is_admin").eq("id", session.user.id).single();
    if (!adminCheck?.is_admin) return;

    set({ usersLoading: true });
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at, last_seen_at")
      .order("last_seen_at", { ascending: false, nullsFirst: false });
    if (data) {
      set({
        userRows: data.map((r) => ({
          id:          r.id,
          fullName:    r.full_name || "—",
          role:        r.role || "Employee",
          joinedAt:    r.created_at,
          lastSeenAt:  r.last_seen_at || null,
        })),
      });
    }
    set({ usersLoading: false });
  };

  const submitFeedback = async (category: string, message: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("feedback").insert({
      user_id:   session.user.id,
      user_name: state.userName,
      user_role: state.role,
      category,
      message,
    });
  };

  const fetchFeedback = async () => {
    // Server-side admin guard — verify from DB, not client state
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: adminCheck } = await supabase
      .from("profiles").select("is_admin").eq("id", session.user.id).single();
    if (!adminCheck?.is_admin) return;

    const { data } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      const items: FeedbackItem[] = data.map((r) => ({
        id:        r.id,
        userName:  r.user_name || "Unknown",
        userRole:  r.user_role || "",
        category:  r.category,
        message:   r.message,
        read:      r.read,
        createdAt: r.created_at,
      }));
      set({
        feedbackItems: items,
        unreadFeedbackCount: items.filter((i) => !i.read).length,
      });
    }
  };

  const markFeedbackRead = async (id: string) => {
    // Verify the caller is an authenticated admin before touching feedback
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();
    if (!profile?.is_admin) return;   // silent no-op for non-admins

    await supabase.from("feedback").update({ read: true }).eq("id", id);
    setState((s) => ({
      ...s,
      feedbackItems: s.feedbackItems.map((i) => i.id === id ? { ...i, read: true } : i),
      unreadFeedbackCount: Math.max(0, s.unreadFeedbackCount - 1),
    }));
  };

  return (
    <AppContext.Provider value={{ state, set, showToast, navigate, signIn, signUp, signOut, sendPasswordReset, updatePassword, fetchCases, addCase, uploadAvatar, fetchShifts, clockIn, clockOut, addOnCallShift, submitFeedback, fetchFeedback, markFeedbackRead, fetchUsers }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
