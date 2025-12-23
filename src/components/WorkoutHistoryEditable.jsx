import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { History, Pencil, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import EmptyState from "@/components/EmptyState";
import WorkoutEditorDialog from "@/components/WorkoutEditorDialog";
import { bestSetScore, formatDate, workoutSummary } from "@/lib/domain";

export default function WorkoutHistoryEditable({ user, exercises, workouts, exercisesById, deleteWorkout, updateWorkout }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return workouts;
    return workouts.filter((w) => {
      if ((w.name || "").toLowerCase().includes(query)) return true;
      const names = (w.exercises || [])
        .map((e) => exercisesById[e.exerciseId]?.name || "")
        .join(" ")
        .toLowerCase();
      return names.includes(query);
    });
  }, [q, workouts, exercisesById]);

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              History
            </div>
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="rounded-2xl pl-9" placeholder="Search workouts…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState title="No workouts yet" subtitle="Log your first workout to start building history." />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filtered
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((w) => {
                    const sum = workoutSummary(w, exercisesById);
                    return (
                      <motion.div
                        key={w.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="rounded-2xl">
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm">
                              <div>
                                <div className="font-semibold">{w.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(w.date)} • {sum.exCount} exercises • Volume ~{Math.round(sum.volume)}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => setEditing(w)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => deleteWorkout(w.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="space-y-2">
                            <div className="text-sm text-muted-foreground">{sum.top || ""}</div>
                            <div className="max-h-56 overflow-auto rounded-2xl border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Exercise</TableHead>
                                    <TableHead>Sets</TableHead>
                                    <TableHead>Best set</TableHead>
                                    <TableHead>Est. 1RM</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(w.exercises || []).map((e) => {
                                    const ex = exercisesById[e.exerciseId];
                                    const best = bestSetScore(e.sets);
                                    return (
                                      <TableRow key={e.exerciseId}>
                                        <TableCell className="font-medium">{ex?.name || "(Unknown)"}</TableCell>
                                        <TableCell>{(e.sets || []).length}</TableCell>
                                        <TableCell>
                                          {best.weight} × {best.reps}
                                        </TableCell>
                                        <TableCell>{Math.round(best.oneRM)}</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogContent className="max-w-3xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit workout</DialogTitle>
          <DialogDescription>Update the date, name, exercises, and sets.</DialogDescription>
        </DialogHeader>

        {editing ? (
          <WorkoutEditorDialog
            user={user}
            exercises={exercises}
            exercisesById={exercisesById}
            initialWorkout={editing}
            onCancel={() => setEditing(null)}
            onSave={(w) => {
              updateWorkout(w);
              setEditing(null);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
