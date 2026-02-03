import { useEffect, useMemo, useState } from "react";
import { deepClone, uid } from "@/lib/domain";
import { supabase } from "@/lib/supabaseClient";
//V3.1 - tuning users

const DEFAULT_SETTINGS = { weightUnit: "kg", plateIncrement: 2.5, showRPE: false };

const seedExercises = [
  { name: "Bench Press", equipment: "Barbell", gifUrl: "" },
  { name: "Squat", equipment: "Barbell", gifUrl: "" },
  { name: "Deadlift", equipment: "Barbell", gifUrl: "" },
  { name: "Overhead Press", equipment: "Barbell", gifUrl: "" },
  { name: "Pull Up", equipment: "Bodyweight", gifUrl: "" },
  { name: "Dumbbell Row", equipment: "Dumbbell", gifUrl: "" },
  { name: "Bicep Curl", equipment: "Dumbbell", gifUrl: "" },
  { name: "Tricep Pushdown", equipment: "Cable", gifUrl: "" }
];

const placeholderUser = {
  id: "loading",
  name: "Loading",
  role: "trainee",
  favorites: [],
  settings: DEFAULT_SETTINGS
};

const emptyState = {
  version: 1,
  activeUserId: placeholderUser.id,
  users: [placeholderUser],
  exercises: [],
  workoutsByUser: { [placeholderUser.id]: [] },
  metricsByUser: { [placeholderUser.id]: [] },
  notesByUser: { [placeholderUser.id]: [] },
  plansByUser: { [placeholderUser.id]: [] }
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

function mapUserFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    favorites: Array.isArray(row.favorites) ? row.favorites : [],
    settings: { ...DEFAULT_SETTINGS, ...(row.settings || {}) }
  };
}

function mapMetricFromDb(row) {
  return { id: row.id, date: row.date, weight: row.weight ?? 0, bodyFat: row.body_fat ?? 0 };
}

function mapMetricToDb(entry, userId) {
  return { id: entry.id, user_id: userId, date: entry.date, weight: entry.weight, body_fat: entry.bodyFat };
}

export function useWorkoutStore() {
  const [state, setState] = useState(() => emptyState);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadForUser = async (user) => {
      try {
        if (!user) return;
        setStatus("loading");
        setError("");

        /*const { data: userRow, error: userError } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();
        if (userError) {
          throw userError;
        }*/
        const { data: userRows, error: allUsersError } = await supabase.from("users").select("*");
        if (allUsersError) throw allUsersError;

        let resolvedUser = mapUserFromDb(userRows?.find((row) => row.id === user.id));
        //let resolvedUser = mapUserFromDb(userRow);

        if (!resolvedUser) {
          const displayName = user.email ? user.email.split("@")[0] : "You";
          const { data: createdUser, error: createError } = await supabase
            .from("users")
            .insert({
              id: user.id,
              name: displayName || "You",
              role: "trainee",
              favorites: [],
              settings: DEFAULT_SETTINGS
            })
            .select()
            .single();
          if (createError) {
            throw createError;
          }
          resolvedUser = mapUserFromDb(createdUser);
        }

        const { data: exercisesData, error: exercisesError } = await supabase.from("exercises").select("*");
        if (exercisesError) {
          throw exercisesError;
        }

        let resolvedExercises = exercisesData || [];
        if (!resolvedExercises?.length) {
          const seeded = seedExercises.map((exercise) => ({ id: uid(), ...exercise }));
          const { data: insertedExercises, error: seedError } = await supabase
            .from("exercises")
            .insert(seeded)
            .select();
          if (seedError) {
            throw seedError;
          }
          resolvedExercises = insertedExercises || [];
        }

        const [workoutsRes, metricsRes, notesRes, plansRes] = await Promise.all([
          supabase.from("workouts").select("*").eq("user_id", user.id),
          supabase.from("metrics").select("*").eq("user_id", user.id),
          supabase.from("notes").select("*").eq("user_id", user.id),
          supabase.from("plans").select("*").eq("user_id", user.id)
        ]);

        if (workoutsRes.error) throw workoutsRes.error;
        if (metricsRes.error) throw metricsRes.error;
        if (notesRes.error) throw notesRes.error;
        if (plansRes.error) throw plansRes.error;

        if (!active) return;

        const activeId = resolvedUser?.id || placeholderUser.id;
        const nextState = {
          version: 1,
          activeUserId: activeId,
          //users: resolvedUser ? [resolvedUser] : [placeholderUser],
          users: (userRows || []).map(mapUserFromDb),
          exercises: resolvedExercises || [],
          workoutsByUser: { [activeId]: workoutsRes.data || [] },
          metricsByUser: { [activeId]: (metricsRes.data || []).map(mapMetricFromDb) },
          notesByUser: { [activeId]: notesRes.data || [] },
          plansByUser: { [activeId]: plansRes.data || [] }
        };
        setState(ensureUserBuckets(nextState, activeId));
        setStatus("ready");
      } catch (error) {
        console.error("Failed to initialize store", error);
        setState(emptyState);
        setStatus("error");
        setError(error?.message || "Failed to load your data.");
      }
    };

    const initialize = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Failed to read session", error);
      }
      if (sessionData?.session?.user) {
        await loadForUser(sessionData.session.user);
      } else {
        setStatus("idle");
      }
    };

    initialize();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        loadForUser(session.user);
      } else {
        setState(emptyState);
        setStatus("idle");
        setError("");
      }
    });
    return () => {
      active = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const activeUser = useMemo(() => getUser(state, state.activeUserId) || state.users[0], [state]);

  const exercisesById = useMemo(() => {
    const m = {};
    for (const e of state.exercises) m[e.id] = e;
    return m;
  }, [state.exercises]);

  const workouts = state.sharedWorkouts || [];
  const metrics = state.metricsByUser[state.activeUserId] || [];
  const notes = state.notesByUser[state.activeUserId] || [];
  const plans = state.plansByUser[state.activeUserId] || [];
  //console.log(users);
  const api = {
    state,
    setActiveUser: (id) => setState((s) => ({ ...s, activeUserId: id })),

    upsertUser: async (userPatch) => {
      const updates = { ...userPatch };
      delete updates.id;
      const { error } = await supabase.from("users").update(updates).eq("id", userPatch.id);
      if (error) {
        console.error("Failed to update user", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        const idx = next.users.findIndex((u) => u.id === userPatch.id);
        if (idx >= 0) next.users[idx] = { ...next.users[idx], ...userPatch };
        return next;
      });
    },

    addUser: async ({ name, role }) => {
      const newUser = {
        id: uid(),
        name: name.trim() || "New user",
        role,
        favorites: [],
        settings: DEFAULT_SETTINGS
      };
      const { error } = await supabase.from("users").insert(newUser);
      if (error) {
        console.error("Failed to add user", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        next.users.push(newUser);
        next.activeUserId = newUser.id;
        next.workoutsByUser[newUser.id] = [];
        next.metricsByUser[newUser.id] = [];
        next.notesByUser[newUser.id] = [];
        next.plansByUser[newUser.id] = [];
        return next;
      });
    },

    deleteUser: async (userId) => {
      if (state.users.length <= 1) return;
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) {
        console.error("Failed to delete user", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        if (next.users.length <= 1) return next;
        next.users = next.users.filter((u) => u.id !== userId);
        delete next.workoutsByUser[userId];
        delete next.metricsByUser[userId];
        delete next.notesByUser[userId];
        delete next.plansByUser[userId];
        if (next.activeUserId === userId) next.activeUserId = next.users[0]?.id || null;
        return next;
      });
    },

    addExercise: async ({ name, equipment, gifUrl }) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const exists = state.exercises.some((e) => e.name.toLowerCase() === trimmed.toLowerCase());
      if (exists) return;
      const exercise = {
        id: uid(),
        name: trimmed,
        equipment: (equipment || "").trim(),
        gifUrl: (gifUrl || "").trim()
      };
      const { error } = await supabase.from("exercises").insert(exercise);
      if (error) {
        console.error("Failed to add exercise", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        next.exercises.unshift(exercise);
        return next;
      });
    },
    updateExercise: async ({ id, name, equipment, gifUrl }) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const exists = state.exercises.some(
        (e) => e.id !== id && e.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) return;
      const updates = {
        name: trimmed,
        equipment: (equipment || "").trim(),
        gifUrl: (gifUrl || "").trim()
      };
      const { error } = await supabase.from("exercises").update(updates).eq("id", id);
      if (error) {
        console.error("Failed to update exercise", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        const idx = next.exercises.findIndex((e) => e.id === id);
        if (idx >= 0) next.exercises[idx] = { ...next.exercises[idx], ...updates };
        return next;
      });
    },

    addWorkout: async (workout) => {
      const record = { ...workout, user_id: state.activeUserId, exercises: workout.exercises || [] };
      const { data, error } = await supabase.from("workouts").insert(record).select().single();
      if (error) {
        console.error("Failed to add workout", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        const list = next.workoutsByUser[next.activeUserId] || [];
        list.push(data);
        list.sort((a, b) => a.date.localeCompare(b.date));
        next.sharedWorkouts = list;
        next.workoutsByUser[next.activeUserId] = list;
        return next;
      });
    },

    updateWorkout: async (updatedWorkout) => {
      const record = { ...updatedWorkout, user_id: state.activeUserId, exercises: updatedWorkout.exercises || [] };
      const { data, error } = await supabase.from("workouts").update(record).eq("id", updatedWorkout.id).select().single();
      if (error) {
        console.error("Failed to update workout", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        const list = next.sharedWorkouts || [];
        const idx = list.findIndex((w) => w.id === updatedWorkout.id);
        if (idx >= 0) list[idx] = data;
        list.sort((a, b) => a.date.localeCompare(b.date));
        next.sharedWorkouts = list;
        next.workoutsByUser[next.activeUserId] = list;
        return next;
      });
    },

    deleteWorkout: async (workoutId) => {
      const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
      if (error) {
        console.error("Failed to delete workout", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        next.sharedWorkouts = (next.sharedWorkouts || []).filter(
          (w) => w.id !== workoutId
        );
        next.workoutsByUser[next.activeUserId] = next.sharedWorkouts;
        return next;
      });
    },

    addMetric: async (entry) => {
      const { data, error } = await supabase
        .from("metrics")
        .insert(mapMetricToDb(entry, state.activeUserId))
        .select()
        .single();
      if (error) {
        console.error("Failed to add metric", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        const list = next.metricsByUser[next.activeUserId] || [];
        const normalized = mapMetricFromDb(data);
        const idx = list.findIndex((m) => m.date === normalized.date);
        if (idx >= 0) list[idx] = { ...list[idx], ...normalized };
        else list.push(normalized);
        list.sort((a, b) => a.date.localeCompare(b.date));
        next.metricsByUser[next.activeUserId] = list;
        return next;
      });
    },

    addNote: async (note) => {
      const record = { ...note, user_id: state.activeUserId };
      const { data, error } = await supabase.from("notes").insert(record).select().single();
      if (error) {
        console.error("Failed to add note", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        const list = next.notesByUser[next.activeUserId] || [];
        list.unshift(data);
        next.notesByUser[next.activeUserId] = list;
        return next;
      });
    },

    deleteNote: async (noteId) => {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (error) {
        console.error("Failed to delete note", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        next.notesByUser[next.activeUserId] = (next.notesByUser[next.activeUserId] || []).filter(
          (n) => n.id !== noteId
        );
        return next;
      });
    },

    addPlan: async (plan) => {
      const record = { ...plan, user_id: state.activeUserId, items: plan.items || [] };
      const { data, error } = await supabase.from("plans").insert(record).select().single();
      if (error) {
        console.error("Failed to add plan", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        const list = next.plansByUser[next.activeUserId] || [];
        list.unshift(data);
        next.plansByUser[next.activeUserId] = list;
        return next;
      });
    },

    deletePlan: async (planId) => {
      const { error } = await supabase.from("plans").delete().eq("id", planId);
      if (error) {
        console.error("Failed to delete plan", error);
        return;
      }
      setState((s) => {
        const next = deepClone(s);
        const list = next.plansByUser[next.activeUserId] || [];
        next.plansByUser[next.activeUserId] = list.filter((p) => p.id !== planId);
        return next;
      });
    },

    resetAll: async () => {
      const userId = state.activeUserId;
      if (!userId) return;
      const operations = [
        supabase.from("workouts").delete().eq("user_id", userId),
        supabase.from("metrics").delete().eq("user_id", userId),
        supabase.from("notes").delete().eq("user_id", userId),
        supabase.from("plans").delete().eq("user_id", userId),
        supabase
          .from("users")
          .update({ name: "You", role: "trainee", favorites: [], settings: DEFAULT_SETTINGS })
          .eq("id", userId)
      ];
      const results = await Promise.all(operations);
      results.forEach((result) => {
        if (result.error) {
          console.error("Failed to reset data", result.error);
        }
      });
      setState((s) => {
        const next = deepClone(s);
        next.users = next.users.map((u) =>
          u.id === userId ? { ...u, name: "You", role: "trainee", favorites: [], settings: DEFAULT_SETTINGS } : u
        );
        next.workoutsByUser[userId] = [];
        next.metricsByUser[userId] = [];
        next.notesByUser[userId] = [];
        next.plansByUser[userId] = [];
        return next;
      });
    }
  };

  return { state, activeUser, exercisesById, workouts, metrics, notes, plans, api, status, error };
}
