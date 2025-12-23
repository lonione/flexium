import { useMemo, useState } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import EmptyState from "@/components/EmptyState";
import { recommendNext, safeNum, todayISO, uid } from "@/lib/domain";

export default function Planner({ user, exercises, workouts, plans, exercisesById, addPlan, deletePlan }) {
  const [date, setDate] = useState(todayISO());
  const [name, setName] = useState("Next workout");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]); // {exerciseId, targetSets, targetReps, targetWeight}

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, exercises]);

  const addItem = (exerciseId) => {
    setItems((prev) => {
      if (prev.some((i) => i.exerciseId === exerciseId)) return prev;
      const rec = recommendNext(user, workouts, exerciseId);
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

  const removeItem = (exerciseId) => setItems((prev) => prev.filter((i) => i.exerciseId !== exerciseId));

  const updateItem = (exerciseId, patch) => {
    setItems((prev) => prev.map((i) => (i.exerciseId === exerciseId ? { ...i, ...patch } : i)));
  };

  const canSave = items.length > 0;

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

          <div className="grid gap-3 md:grid-cols-2">
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
                        key={e.id}
                        onClick={() => addItem(e.id)}
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
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>Targets</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-2xl"
                    onClick={() => {
                      // Apply fresh recommendations to all items
                      setItems((prev) =>
                        prev.map((it) => {
                          const rec = recommendNext(user, workouts, it.exerciseId);
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
                                <Input className="h-9 w-20 rounded-2xl" type="number" value={it.targetSets} onChange={(e) => updateItem(it.exerciseId, { targetSets: safeNum(e.target.value) })} />
                              </TableCell>
                              <TableCell>
                                <Input className="h-9 w-24 rounded-2xl" type="number" value={it.targetReps} onChange={(e) => updateItem(it.exerciseId, { targetReps: safeNum(e.target.value) })} />
                              </TableCell>
                              <TableCell>
                                <Input className="h-9 w-28 rounded-2xl" inputMode="decimal" value={it.targetWeight} onChange={(e) => updateItem(it.exerciseId, { targetWeight: safeNum(e.target.value) })} />
                              </TableCell>
                              <TableCell>
                                <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => removeItem(it.exerciseId)}>
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

                <div className="flex justify-end">
                  <Button
                    className="rounded-2xl"
                    disabled={!canSave}
                    onClick={() => {
                      if (!canSave) return;
                      addPlan({ id: uid(), date, name: name.trim() || "Next workout", items });
                      setItems([]);
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
                            {p.date} • {(p.items || []).length} items
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => deletePlan(p.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {(p.items || [])
                        .slice(0, 4)
                        .map((it) => exercisesById[it.exerciseId]?.name || "(Unknown)")
                        .join(" • ")}
                      {(p.items || []).length > 4 ? " • …" : ""}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
