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
  | "admin"
  | "notifications";

export type AuthMode = "signin" | "signup";
export type Role = "Employee" | "Student";
export type ChatMode = "interaction" | "question";
export type Severity = "None" | "Minor" | "Moderate" | "Major";
export type PatientPreg = "Not pregnant" | "Pregnant" | "Breastfeeding";

export interface Case {
  id: string;
  date: string;
  time: string;
  meds: string;
  severity: Severity;
  drp: boolean;
  flagged: boolean;
  counsel: string;
  source: "Rx" | "Manual";
  countOnly: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: ChatMode;
  severity?: Severity;
  patientContext?: string;
  counselling?: string[];
  sources?: string[];
  thinking?: boolean;
}

export interface AppState {
  screen: Screen;
  authMode: AuthMode;
  role: Role;
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
  clockTime: string;

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
    sources: ["https://store.wolterskluwercdi.com/CDI", "https://www.drugs.com/"],
  },
];

const initialState: AppState = {
  screen: "login",
  authMode: "signin",
  role: "Employee",
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
  clockTime: "08:00",

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
};

interface AppContextType {
  state: AppState;
  set: (partial: Partial<AppState>) => void;
  showToast: (msg: string) => void;
  navigate: (screen: Screen) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: Role) => Promise<void>;
  signOut: () => Promise<void>;
  fetchCases: () => Promise<void>;
  addCase: (c: Omit<Case, "id" | "date" | "time">) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
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

  const navigate = (screen: Screen) => set({ screen, notifOpen: false });

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, full_name, role")
      .eq("id", userId)
      .single();
    if (data) {
      set({
        avatarUrl: data.avatar_url || null,
        userName: data.full_name || "",
        role: data.role || "Employee",
      });
    }
  };

  // Restore session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        set({
          supabaseUser: session.user,
          userName: session.user.user_metadata?.full_name || session.user.email || "",
          userEmail: session.user.email || "",
          role: session.user.user_metadata?.role || "Employee",
          screen: "agreement",
        });
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          supabaseUser: session.user,
          userName: session.user.user_metadata?.full_name || session.user.email || "",
          userEmail: session.user.email || "",
          role: session.user.user_metadata?.role || "Employee",
        });
      } else {
        set({ supabaseUser: null, userName: "", userEmail: "", screen: "login" });
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    set({ authLoading: true, authError: "" });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ authLoading: false, authError: error.message });
    } else {
      set({ authLoading: false, screen: "agreement" });
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: Role) => {
    set({ authLoading: true, authError: "" });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) {
      set({ authLoading: false, authError: error.message });
    } else {
      set({ authLoading: false, screen: "agreement" });
    }
  };

  const signOut = async () => {
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

  const addCase = async (c: Omit<Case, "id" | "date" | "time">) => {
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

  return (
    <AppContext.Provider value={{ state, set, showToast, navigate, signIn, signUp, signOut, fetchCases, addCase, uploadAvatar }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
