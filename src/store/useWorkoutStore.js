import { useEffect, useState, useMemo } from "react";
import { uid, deepClone } from "@/lib/domain";

const STORAGE_KEY = "flexium_v1";

const seedUser = {
  id: uid(),
  name: "You",
  role: "trainee",
  favorites: [],
  settings: { weightUnit: "kg", plateIncrement: 2.5, showRPE: false }
};

const defaultState = {
  activeUserId: seedUser.id,
  users: [seedUser],
  exercises: [],
  workoutsByUser: { [seedUser.id]: [] },
  metricsByUser: { [seedUser.id]: [] },
  notesByUser: { [seedUser.id]: [] },
  plansByUser: { [seedUser.id]: [] }
};

export function useWorkoutStore() {
  const [state, setState] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activeUser = useMemo(
    () => state.users.find((u) => u.id === state.activeUserId),
    [state]
  );

  return { state, activeUser, setState };
}
