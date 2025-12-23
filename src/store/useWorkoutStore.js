import { useEffect, useMemo, useState } from "react";
import { deepClone, uid } from "@/lib/domain";

const STORAGE_KEY = "flexium_v1";

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const seedExercises = [
  { id: uid(), name: "Bench Press", muscle: "Chest", equipment: "Barbell" },
  { id: uid(), name: "Squat", muscle: "Legs", equipment: "Barbell" },
  { id: uid(), name: "Deadlift", muscle: "Back", equipment: "Barbell" },
  { id: uid(), name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell" },
  { id: uid(), name: "Pull Up", muscle: "Back", equipment: "Bodyweight" },
  { id: uid(), name: "Dumbbell Row", muscle: "Back", equipment: "Dumbbell" },
  { id: uid(), name: "Bicep Curl", muscle: "Arms", equipment: "Dumbbell" },
  { id: uid(), name: "Tricep Pushdown", muscle: "Arms", equipment: "Cable" }
];

const seedUser = {
  id: uid(),
  name: "You",
  role: "trainee",
  favorites: [],
  settings: { weightUnit: "kg", plateIncrement: 2.5, showRPE: false }
};

const defaultState = {
  version: 1,
  activeUserId: seedUser.id,
  users: [seedUser],
  exercises: seedExercises,
  workoutsByUser: { [seedUser.id]: [] },
  metricsByUser: { [seedUser.id]: [] },
  notesByUser: { [seedUser.id]: [] },
  plansByUser: { [seedUser.id]: [] }
};

function getUser(state, userId) {
  return state.users.find((u) => u.id === userId) || null;
}

function ensureUserBuckets(state, userId) {
  const s = deepClone(state);
  s.workoutsByUser[userId] = s.workoutsByUser[userId] || [];
  s.metricsByUser[userId] = s.metricsByUser[userId] || [];
  s.notesByUser[userId] = s.notesByUser[userId] || [];
  s.plansByUser[userId] = s.plansByUser[userId] || [];
  return s;
}

export function useWorkoutStore() {
  const [state, setState] = useState(() => loadState() || defaultState);

  useEffect(() => saveState(state), [state]);

  useEffect(() => {
    setState((s) => ensureUserBuckets(s, s.activeUserId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeUser = useMemo(() => getUser(state, state.activeUserId) || state.users[0], [state]);

  const exercisesById = useMemo(() => {
    const m = {};
    for (const e of state.exercises) m[e.id] = e;
    return m;
  }, [state.exercises]);

  const workouts = state.workoutsByUser[state.activeUserId] || [];
  const metrics = state.metricsByUser[state.activeUserId] || [];
  const notes = state.notesByUser[state.activeUserId] || [];
  const plans = state.plansByUser[state.activeUserId] || [];

  const api = {
    state,
    setActiveUser: (id) => setState((s) => ({ ...s, activeUserId: id })),

    upsertUser: (userPatch) =>
      setState((s) => {
        const next = deepClone(s);
        const idx = next.users.findIndex((u) => u.id === userPatch.id);
        if (idx >= 0) next.users[idx] = { ...next.users[idx], ...userPatch };
        return next;
      }),

    addUser: ({ name, role }) =>
      setState((s) => {
        const next = deepClone(s);
        const u = {
          id: uid(),
          name: name.trim() || "New user",
          role,
          favorites: [],
          settings: { weightUnit: "kg", plateIncrement: 2.5, showRPE: false }
        };
        next.users.push(u);
        next.activeUserId = u.id;
        next.workoutsByUser[u.id] = [];
        next.metricsByUser[u.id] = [];
        next.notesByUser[u.id] = [];
        next.plansByUser[u.id] = [];
        return next;
      }),

    deleteUser: (userId) =>
      setState((s) => {
        const next = deepClone(s);
        if (next.users.length <= 1) return next;
        next.users = next.users.filter((u) => u.id !== userId);
        delete next.workoutsByUser[userId];
        delete next.metricsByUser[userId];
        delete next.notesByUser[userId];
        delete next.plansByUser[userId];
        if (next.activeUserId === userId) next.activeUserId = next.users[0].id;
        return next;
      }),

    addExercise: ({ name, muscle, equipment }) =>
      setState((s) => {
        const next = deepClone(s);
        const trimmed = name.trim();
        if (!trimmed) return next;
        const exists = next.exercises.some((e) => e.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) return next;
        next.exercises.unshift({
          id: uid(),
          name: trimmed,
          muscle: (muscle || "").trim(),
          equipment: (equipment || "").trim()
        });
        return next;
      }),

    addWorkout: (workout) =>
      setState((s) => {
        const next = deepClone(s);
        const list = next.workoutsByUser[next.activeUserId] || [];
        list.push(workout);
        list.sort((a, b) => a.date.localeCompare(b.date));
        next.workoutsByUser[next.activeUserId] = list;
        return next;
      }),

    updateWorkout: (updatedWorkout) =>
      setState((s) => {
        const next = deepClone(s);
        const list = next.workoutsByUser[next.activeUserId] || [];
        const idx = list.findIndex((w) => w.id === updatedWorkout.id);
        if (idx >= 0) list[idx] = updatedWorkout;
        list.sort((a, b) => a.date.localeCompare(b.date));
        next.workoutsByUser[next.activeUserId] = list;
        return next;
      }),

    deleteWorkout: (workoutId) =>
      setState((s) => {
        const next = deepClone(s);
        next.workoutsByUser[next.activeUserId] = (next.workoutsByUser[next.activeUserId] || []).filter(
          (w) => w.id !== workoutId
        );
        return next;
      }),

    addMetric: (entry) =>
      setState((s) => {
        const next = deepClone(s);
        const list = next.metricsByUser[next.activeUserId] || [];
        const idx = list.findIndex((m) => m.date === entry.date);
        if (idx >= 0) list[idx] = { ...list[idx], ...entry };
        else list.push(entry);
        list.sort((a, b) => a.date.localeCompare(b.date));
        next.metricsByUser[next.activeUserId] = list;
        return next;
      }),

    addNote: (note) =>
      setState((s) => {
        const next = deepClone(s);
        const list = next.notesByUser[next.activeUserId] || [];
        list.unshift(note);
        next.notesByUser[next.activeUserId] = list;
        return next;
      }),

    deleteNote: (noteId) =>
      setState((s) => {
        const next = deepClone(s);
        next.notesByUser[next.activeUserId] = (next.notesByUser[next.activeUserId] || []).filter(
          (n) => n.id !== noteId
        );
        return next;
      }),

    addPlan: (plan) =>
      setState((s) => {
        const next = deepClone(s);
        const list = next.plansByUser[next.activeUserId] || [];
        list.unshift(plan);
        next.plansByUser[next.activeUserId] = list;
        return next;
      }),

    deletePlan: (planId) =>
      setState((s) => {
        const next = deepClone(s);
        next.plansByUser[next.activeUserId] = (next.plansByUser[next.activeUserId] || []).filter(
          (p) => p.id !== planId
        );
        return next;
      }),

    resetAll: () => {
      localStorage.removeItem(STORAGE_KEY);
      setState(defaultState);
    }
  };

  return { state, activeUser, exercisesById, workouts, metrics, notes, plans, api };
}
