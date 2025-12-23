import React, { useMemo } from "react";
import { motion } from "framer-motion";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Header from "@/components/Header";
import OverviewPanel from "@/components/OverviewPanel";
import QuickAdd from "@/components/QuickAdd";
import CalendarMini from "@/components/CalendarMini";
import WorkoutLogger from "@/components/WorkoutLogger";
import WorkoutHistoryEditable from "@/components/WorkoutHistoryEditable";
import Planner from "@/components/Planner";
import ExerciseLibrary from "@/components/ExerciseLibrary";
import Notes from "@/components/Notes";

import { useWorkoutStore } from "@/store/useWorkoutStore";
import { monthKey, safeNum, todayISO, workoutSummary } from "@/lib/domain";

export default function App() {
  const { state, activeUser, exercisesById, workouts, metrics, notes, plans, api } = useWorkoutStore();

  const stats = useMemo(() => {
    const totalWorkouts = workouts.length;
    const last = workouts[workouts.length - 1] || null;
    const thisMonth = monthKey(todayISO());
    const workoutsThisMonth = workouts.filter((w) => monthKey(w.date) === thisMonth).length;
    const volThisMonth = workouts
      .filter((w) => monthKey(w.date) === thisMonth)
      .reduce((sum, w) => sum + workoutSummary(w, exercisesById).volume, 0);

    return { totalWorkouts, workoutsThisMonth, lastDate: last?.date || null, volThisMonth };
  }, [workouts, exercisesById]);

  const metricChart = useMemo(() => {
    const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((m) => ({ date: m.date.slice(5), weight: safeNum(m.weight), bodyFat: safeNum(m.bodyFat) }));
  }, [metrics]);

  const workoutsByDate = useMemo(() => {
    const m = new Map();
    for (const w of workouts) m.set(w.date, (m.get(w.date) || 0) + 1);
    return m;
  }, [workouts]);

  const plansByDate = useMemo(() => {
    const m = new Map();
    for (const p of plans) m.set(p.date, (m.get(p.date) || 0) + 1);
    return m;
  }, [plans]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <Header
          state={state}
          activeUser={activeUser}
          setActiveUser={api.setActiveUser}
          addUser={api.addUser}
          deleteUser={api.deleteUser}
          upsertUser={api.upsertUser}
          resetAll={api.resetAll}
        />

        <div className="mt-6 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
              <OverviewPanel activeUser={activeUser} stats={stats} metricChart={metricChart} />
              <QuickAdd user={activeUser} addMetric={api.addMetric} addNote={api.addNote} />
              <CalendarMini workoutsByDate={workoutsByDate} plansByDate={plansByDate} />
            </motion.div>
          </div>

          <div className="md:col-span-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
              <Tabs defaultValue="log" className="w-full">
                <TabsList className="grid w-full grid-cols-5 rounded-2xl">
                  <TabsTrigger value="log" className="rounded-2xl">Log</TabsTrigger>
                  <TabsTrigger value="history" className="rounded-2xl">History</TabsTrigger>
                  <TabsTrigger value="plan" className="rounded-2xl">Plan</TabsTrigger>
                  <TabsTrigger value="exercises" className="rounded-2xl">Exercises</TabsTrigger>
                  <TabsTrigger value="notes" className="rounded-2xl">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="log" className="mt-4">
                  <WorkoutLogger
                    user={activeUser}
                    exercises={state.exercises}
                    workouts={workouts}
                    addWorkout={api.addWorkout}
                    exercisesById={exercisesById}
                  />
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <WorkoutHistoryEditable
                    user={activeUser}
                    exercises={state.exercises}
                    workouts={workouts}
                    exercisesById={exercisesById}
                    deleteWorkout={api.deleteWorkout}
                    updateWorkout={api.updateWorkout}
                  />
                </TabsContent>

                <TabsContent value="plan" className="mt-4">
                  <Planner
                    user={activeUser}
                    exercises={state.exercises}
                    workouts={workouts}
                    plans={plans}
                    exercisesById={exercisesById}
                    addPlan={api.addPlan}
                    deletePlan={api.deletePlan}
                  />
                </TabsContent>

                <TabsContent value="exercises" className="mt-4">
                  <ExerciseLibrary
                    user={activeUser}
                    exercises={state.exercises}
                    addExercise={api.addExercise}
                    toggleFavorite={(exerciseId) => {
                      const fav = new Set(activeUser.favorites || []);
                      fav.has(exerciseId) ? fav.delete(exerciseId) : fav.add(exerciseId);
                      api.upsertUser({ id: activeUser.id, favorites: Array.from(fav) });
                    }}
                  />
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  <Notes notes={notes} addNote={api.addNote} deleteNote={api.deleteNote} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>

        <footer className="mt-10 pb-10 text-center text-xs text-muted-foreground">
          Local-first demo • Data stored in your browser • Export/import can be added
        </footer>
      </div>
    </div>
  );
}
