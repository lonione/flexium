import { useMemo, useState } from "react";
import { Plus, Save, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import EmptyState from "@/components/EmptyState";
import { safeNum } from "@/lib/domain";

export default function WorkoutEditorDialog({ user, exercises, exercisesById, initialWorkout, onCancel, onSave }) {
  const [date, setDate] = useState(initialWorkout.date);
  const [name, setName] = useState(initialWorkout.name || "Workout");
  const [query, setQuery] = useState("");

  const [entries, setEntries] = useState(() =>
    (initialWorkout.exercises || []).map((e) => ({
      exerciseId: e.exerciseId,
      sets: (e.sets || []).map((s) => ({
        reps: safeNum(s.reps),
        weight: safeNum(s.weight),
        rpe: user.settings.showRPE ? safeNum(s.rpe) : 0
      }))
    }))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, exercises]);

  const pickExercise = (id) => {
    setEntries((prev) => {
      if (prev.some((e) => e.exerciseId === id)) return prev;
      return [...prev, { exerciseId: id, sets: [{ reps: 8, weight: 0, rpe: 0 }] }];
    });
  };

  const removeExercise = (exerciseId) => setEntries((prev) => prev.filter((e) => e.exerciseId !== exerciseId));

  const updateSet = (exerciseId, idx, patch) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const sets = (e.sets || []).map((s, i) => (i === idx ? { ...s, ...patch } : s));
        return { ...e, sets };
      })
    );
  };

  const addSet = (exerciseId) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const last = (e.sets || [])[e.sets.length - 1] || { reps: 8, weight: 0, rpe: 0 };
        return { ...e, sets: [...(e.sets || []), { ...last }] };
      })
    );
  };

  const removeSet = (exerciseId, idx) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e;
        const sets = (e.sets || []).filter((_, i) => i !== idx);
        return { ...e, sets: sets.length ? sets : [{ reps: 8, weight: 0, rpe: 0 }] };
      })
    );
  };

  const canSave = entries.length > 0;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input className="rounded-2xl" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Workout name</Label>
          <Input className="rounded-2xl" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Add exercises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="rounded-2xl pl-9" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="max-h-56 overflow-auto rounded-2xl border">
              {filtered.map((e) => {
                const isIn = entries.some((x) => x.exerciseId === e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => pickExercise(e.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{e.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.muscle || ""}{e.equipment ? ` • ${e.equipment}` : ""}
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
            <CardTitle className="text-sm">Edit sets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {entries.length === 0 ? (
              <EmptyState title="No exercises" subtitle="Add at least one exercise to save changes." />
            ) : (
              <div className="space-y-3">
                {entries.map((e) => {
                  const ex = exercisesById[e.exerciseId];
                  return (
                    <Card key={e.exerciseId} className="rounded-2xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span>{ex?.name || "(Unknown)"}</span>
                            {ex?.muscle ? <Badge variant="secondary">{ex.muscle}</Badge> : null}
                          </div>
                          <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => removeExercise(e.exerciseId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-14">Set</TableHead>
                              <TableHead>Reps</TableHead>
                              <TableHead>Weight ({user.settings.weightUnit})</TableHead>
                              {user.settings.showRPE ? <TableHead>RPE</TableHead> : null}
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(e.sets || []).map((s, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{idx + 1}</TableCell>
                                <TableCell>
                                  <Input className="h-9 w-24 rounded-2xl" type="number" value={s.reps} onChange={(ev) => updateSet(e.exerciseId, idx, { reps: safeNum(ev.target.value) })} />
                                </TableCell>
                                <TableCell>
                                  <Input className="h-9 w-28 rounded-2xl" inputMode="decimal" value={s.weight} onChange={(ev) => updateSet(e.exerciseId, idx, { weight: safeNum(ev.target.value) })} />
                                </TableCell>
                                {user.settings.showRPE ? (
                                  <TableCell>
                                    <Input className="h-9 w-24 rounded-2xl" inputMode="decimal" value={s.rpe || 0} onChange={(ev) => updateSet(e.exerciseId, idx, { rpe: safeNum(ev.target.value) })} />
                                  </TableCell>
                                ) : null}
                                <TableCell>
                                  <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => removeSet(e.exerciseId, idx)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        <div className="flex justify-end">
                          <Button size="sm" variant="secondary" className="rounded-2xl" onClick={() => addSet(e.exerciseId)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add set
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="secondary" className="rounded-2xl" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="rounded-2xl"
          disabled={!canSave}
          onClick={() => {
            if (!canSave) return;
            onSave({
              ...initialWorkout,
              date,
              name: name.trim() || "Workout",
              exercises: entries.map((e) => ({
                exerciseId: e.exerciseId,
                sets: (e.sets || []).map((s) => ({
                  reps: safeNum(s.reps),
                  weight: safeNum(s.weight),
                  rpe: user.settings.showRPE ? safeNum(s.rpe) : undefined
                }))
              }))
            });
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          Save changes
        </Button>
      </DialogFooter>
    </div>
  );
}
