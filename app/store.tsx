"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

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

const initialCases: Case[] = [
  { id: "c1", date: "27 Jun 2026", time: "09:14", meds: "Warfarin + Aspirin", severity: "Major", drp: true, flagged: true, counsel: "Monitor INR closely; risk of bleeding.", source: "Rx", countOnly: false },
  { id: "c2", date: "26 Jun 2026", time: "14:32", meds: "Metformin + Ibuprofen", severity: "Moderate", drp: false, flagged: false, counsel: "Monitor renal function.", source: "Rx", countOnly: false },
  { id: "c3", date: "26 Jun 2026", time: "11:05", meds: "Amoxicillin", severity: "Minor", drp: false, flagged: false, counsel: "Complete the full course.", source: "Manual", countOnly: false },
  { id: "c4", date: "25 Jun 2026", time: "16:00", meds: "", severity: "None", drp: false, flagged: false, counsel: "", source: "Manual", countOnly: true },
];

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
  userName: "Reem Al-Saleh",

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

  cases: initialCases,
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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const set = (partial: Partial<AppState>) =>
    setState((s) => ({ ...s, ...partial }));

  const showToast = (msg: string) => {
    set({ toastOn: true, toastMsg: msg });
    setTimeout(() => set({ toastOn: false, toastMsg: "" }), 2700);
  };

  const navigate = (screen: Screen) => set({ screen, notifOpen: false });

  return (
    <AppContext.Provider value={{ state, set, showToast, navigate }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
