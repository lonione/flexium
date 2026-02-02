import { useMemo, useState } from "react";
import { ClipboardCheck, Plus, Trash2, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import EmptyState from "@/components/EmptyState";
import WorkoutEditorDialog from "@/components/WorkoutEditorDialog";
import { recommendNext, safeNum, todayISO, uid } from "@/lib/domain";

export default function Planner({ user, users, exercises, workouts, plans, exercisesById, addPlan, addWorkout, deletePlan }) {
  const [date, setDate] = useState(todayISO());
  const [name, setName] = useState("Next workout");
  const [query, setQuery] = useState("");
  const [traineeIds, setTraineeIds] = useState([]);
  const [itemsByTrainee, setItemsByTrainee] = useState({}); // {traineeId: [{exerciseId, targetSets, targetReps, targetWeight}]}
  const [planToLog, setPlanToLog] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, exercises]);

  const trainees = useMemo(() => users.filter((u) => u.role === "trainee"), [users]);

  const toggleTrainee = (id) => {
    setTraineeIds((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      return [...prev, id];
    });
    setItemsByTrainee((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: [] };
    });
  };

  const updateItems = (traineeId, updater) => {
    setItemsByTrainee((prev) => {
      const next = { ...prev };
      next[traineeId] = updater(prev[traineeId] || []);
      return next;
    });
  };

  const addItem = (traineeId, exerciseId) => {
    updateItems(traineeId, (prev) => {
      if (prev.some((i) => i.exerciseId === exerciseId)) return prev;
      const trainee = users.find((u) => u.id === traineeId) || user;
      const rec = recommendNext(trainee, workouts, exerciseId);
      return [
        ...prev,
        {
          exerciseId,
          targetSets: rec.targetSets,
          targetReps: rec.targetReps,
          targetWeight: rec.targetWeight
        }
      ];
    });
  };

  const removeItem = (traineeId, exerciseId) =>
    updateItems(traineeId, (prev) => prev.filter((i) => i.exerciseId !== exerciseId));

  const updateItem = (traineeId, exerciseId, patch) => {
    updateItems(traineeId, (prev) => prev.map((i) => (i.exerciseId === exerciseId ? { ...i, ...patch } : i)));
  };

  const canSave = traineeIds.some((id) => (itemsByTrainee[id] || []).length > 0);

  const buildWorkoutFromPlan = (plan) => {
    return {
      id: uid(),
      date: plan.date || todayISO(),
      name: plan.name || "Workout",
      trainees: (plan.trainees || []).map((t) => ({
        traineeId: t.traineeId,
        exercises: (t.items || []).map((it) => {
          const setsCount = Math.max(1, safeNum(it.targetSets));
          const reps = safeNum(it.targetReps);
          const weight = safeNum(it.targetWeight);
          return {
            exerciseId: it.exerciseId,
            sets: Array.from({ length: setsCount }, () => ({
              reps,
              weight,
              rpe: user.settings.showRPE ? 0 : undefined
            }))
          };
        })
      }))
    };
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input className="rounded-2xl" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Plan name</Label>
              <Input className="rounded-2xl" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Trainees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trainees.length === 0 ? (
                <EmptyState title="No trainees" subtitle="Add trainees in the Users menu to assign this plan." />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {trainees.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={traineeIds.includes(t.id)}
                        onChange={() => toggleTrainee(t.id)}
                      />
                      <span>{t.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {traineeIds.length === 0 ? (
            <EmptyState title="No trainees selected" subtitle="Select at least one trainee to build a plan." />
          ) : (
            traineeIds.map((traineeId) => {
              const trainee = trainees.find((t) => t.id === traineeId);
              const items = itemsByTrainee[traineeId] || [];
              return (
                <Card key={traineeId} className="rounded-2xl border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>{trainee?.name || "Trainee"} targets</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-2xl"
                        onClick={() => {
                          updateItems(traineeId, (prev) =>
                            prev.map((it) => {
                              const rec = recommendNext(trainee || user, workouts, it.exerciseId);
                              return { ...it, targetSets: rec.targetSets, targetReps: rec.targetReps, targetWeight: rec.targetWeight };
                            })
                          );
                        }}
                        disabled={items.length === 0}
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Recompute
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <Card className="rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Add exercises</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input className="rounded-2xl" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
                        <div className="max-h-56 overflow-auto rounded-2xl border">
                          {filtered.map((e) => {
                            const isIn = items.some((x) => x.exerciseId === e.id);
                            return (
                              <button
                                key={`${traineeId}-${e.id}`}
                                onClick={() => addItem(traineeId, e.id)}
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
                              >
                                <div>
                                  <div className="font-medium">{e.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {e.equipment || "No equipment listed"}
                                  </div>
                                </div>
                                {isIn ? <Badge>Added</Badge> : <Badge variant="secondary">Add</Badge>}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Targets</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {items.length === 0 ? (
                          <EmptyState title="No plan items" subtitle="Add exercises on the left to build a plan." />
                        ) : (
                          <div className="max-h-72 overflow-auto rounded-2xl border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Exercise</TableHead>
                                  <TableHead className="w-20">Sets</TableHead>
                                  <TableHead className="w-24">Reps</TableHead>
                                  <TableHead className="w-32">Weight</TableHead>
                                  <TableHead className="w-12" />
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map((it) => {
                                  const ex = exercisesById[it.exerciseId];
                                  return (
                                    <TableRow key={it.exerciseId}>
                                      <TableCell className="font-medium">{ex?.name || "(Unknown)"}</TableCell>
                                      <TableCell>
                                        <Input className="h-9 w-20 rounded-2xl" type="number" value={it.targetSets} onChange={(e) => updateItem(traineeId, it.exerciseId, { targetSets: safeNum(e.target.value) })} />
                                      </TableCell>
                                      <TableCell>
                                        <Input className="h-9 w-24 rounded-2xl" type="number" value={it.targetReps} onChange={(e) => updateItem(traineeId, it.exerciseId, { targetReps: safeNum(e.target.value) })} />
                                      </TableCell>
                                      <TableCell>
                                        <Input className="h-9 w-28 rounded-2xl" inputMode="decimal" value={it.targetWeight} onChange={(e) => updateItem(traineeId, it.exerciseId, { targetWeight: safeNum(e.target.value) })} />
                                      </TableCell>
                                      <TableCell>
                                        <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => removeItem(traineeId, it.exerciseId)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              );
            })
          )}

          <div className="flex justify-end">
            <Button
              className="rounded-2xl"
              disabled={!canSave}
              onClick={() => {
                if (!canSave) return;
                const traineesPayload = traineeIds.map((traineeId) => ({
                  traineeId,
                  items: itemsByTrainee[traineeId] || []
                }));
                addPlan({ id: uid(), date, name: name.trim() || "Next workout", trainees: traineesPayload });
                setItemsByTrainee({});
                setTraineeIds([]);
                setName("Next workout");
                setDate(todayISO());
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Save plan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Saved plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plans.length === 0 ? (
            <EmptyState title="No plans yet" subtitle="Create a plan above to see it here." />
          ) : (
            <div className="space-y-2">
              {plans
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((p) => (
                  <Card key={p.id} className="rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.date} • {(p.trainees || []).length} trainees
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-2xl"
                            onClick={() => setPlanToLog({ planId: p.id, workout: buildWorkoutFromPlan(p) })}
                          >
                            <ClipboardCheck className="mr-2 h-4 w-4" />
                            Log workout
                          </Button>
                          <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => deletePlan(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {(p.trainees || [])
                        .slice(0, 3)
                        .map((t) => users.find((u) => u.id === t.traineeId)?.name || "Trainee")
                        .join(" • ")}
                      {(p.trainees || []).length > 3 ? " • …" : ""}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!planToLog} onOpenChange={(open) => !open && setPlanToLog(null)}>
        <DialogContent className="max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Log planned workout</DialogTitle>
            <DialogDescription>Adjust the plan before saving it as a logged workout. The plan will be removed once saved.</DialogDescription>
          </DialogHeader>
          {planToLog ? (
            <WorkoutEditorDialog
              user={user}
              users={users}
              exercises={exercises}
              exercisesById={exercisesById}
              initialWorkout={planToLog.workout}
              onCancel={() => setPlanToLog(null)}
              onSave={async (workout) => {
                await addWorkout(workout);
                await deletePlan(planToLog.planId);
                setPlanToLog(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
