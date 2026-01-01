export const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);
export const todayISO = () => new Date().toISOString().slice(0, 10);

export function formatDate(iso) {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function roundTo(n, step) {
  if (!step) return n;
  const inv = 1 / step;
  return Math.round(n * inv) / inv;
}

export const monthKey = (iso) => iso.slice(0, 7);

export function startOfMonthISO(iso) {
  const [y, m] = iso.split("-").map(Number);
  // Use UTC to avoid timezone offsets pushing the date into the previous month
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1));
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function addMonths(iso, delta) {
  const [y, m] = iso.split("-").map(Number);
  // Work in UTC to avoid timezone offsets affecting the month rollovers
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1));
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function daysInMonth(iso) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function weekdayIndex(iso) {
  const d = new Date(iso + "T00:00:00");
  return (d.getDay() + 6) % 7; // Monday=0
}

export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

export function estimate1RM(weight, reps) {
  const w = safeNum(weight);
  const r = safeNum(reps);
  if (w <= 0 || r <= 0) return 0;
  return w * (1 + r / 30); // Epley
}

export function bestSetScore(sets) {
  let best = { oneRM: 0, volume: 0, reps: 0, weight: 0 };
  for (const s of sets || []) {
    const reps = safeNum(s.reps);
    const weight = safeNum(s.weight);
    const oneRM = estimate1RM(weight, reps);
    const volume = weight * reps;
    if (oneRM > best.oneRM || (oneRM === best.oneRM && volume > best.volume)) {
      best = { oneRM, volume, reps, weight };
    }
  }
  return best;
}

export function lastPerformance(workouts, exerciseId) {
  for (let i = workouts.length - 1; i >= 0; i--) {
    const w = workouts[i];
    const ex = (w.exercises || []).find((e) => e.exerciseId === exerciseId);
    if (ex) return { workout: w, entry: ex };
  }
  return null;
}

export function recommendNext(user, workouts, exerciseId) {
  const perf = lastPerformance(workouts, exerciseId);
  const rounding = clamp(Number(user?.settings?.plateIncrement) || 2.5, 0.25, 10);

  let targetSets = 3;
  let targetReps = 8;
  let targetWeight = 0;
  let note = "";

  if (!perf) {
    note = "No history yet — start light and focus on form.";
    return { targetSets, targetReps, targetWeight, note };
  }

  const best = bestSetScore(perf.entry.sets);

  targetWeight = best.weight;
  targetReps = clamp(best.reps, 3, 20);
  targetSets = clamp((perf.entry.sets || []).length || 3, 1, 8);

  if (best.reps >= 8) {
    targetWeight = roundTo(best.weight + rounding, rounding);
    targetReps = 8;
    note = `Progression: +${rounding}${user.settings.weightUnit} and aim for 8 reps.`;
  } else {
    targetWeight = best.weight;
    targetReps = clamp(best.reps + 1, 3, 12);
    note = "Progression: keep weight and add 1 rep on your best set.";
  }

  return { targetSets, targetReps, targetWeight, note };
}

export function workoutSummary(workout, exercisesById) {
  const exCount = (workout.exercises || []).length;
  const volume = (workout.exercises || []).reduce((sum, e) => {
    return sum + (e.sets || []).reduce((s2, set) => s2 + safeNum(set.weight) * safeNum(set.reps), 0);
  }, 0);

  const top = (workout.exercises || [])
    .slice(0, 3)
    .map((e) => exercisesById[e.exerciseId]?.name || "(Unknown)")
    .join(" • ");

  return { exCount, volume, top };
}
