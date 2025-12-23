import { useMemo, useState } from "react";
import { Plus, Search, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import EmptyState from "@/components/EmptyState";

export default function ExerciseLibrary({ user, exercises, addExercise, toggleFavorite }) {
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return exercises;
    return exercises.filter((e) => (e.name || "").toLowerCase().includes(query));
  }, [q, exercises]);

  const fav = new Set(user.favorites || []);

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Exercises</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <div className="space-y-2 sm:col-span-3">
            <Label>Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="rounded-2xl pl-9" placeholder="Search exercises…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>New exercise</Label>
            <Input className="rounded-2xl" placeholder="e.g., Incline DB Press" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Muscle</Label>
            <Input className="rounded-2xl" placeholder="e.g., Chest" value={muscle} onChange={(e) => setMuscle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Equipment</Label>
            <Input className="rounded-2xl" placeholder="e.g., Dumbbell" value={equipment} onChange={(e) => setEquipment(e.target.value)} />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <Button
              className="rounded-2xl"
              onClick={() => {
                addExercise({ name, muscle, equipment });
                setName("");
                setMuscle("");
                setEquipment("");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add exercise
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState title="No matches" subtitle="Try a different search or add a new exercise." />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.map((e) => {
                const isFav = fav.has(e.id);
                return (
                  <div key={e.id} className="flex items-center justify-between rounded-2xl border bg-background px-3 py-2 shadow-sm">
                    <div>
                      <div className="font-medium">{e.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.muscle || ""}{e.equipment ? ` • ${e.equipment}` : ""}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.muscle ? <Badge variant="secondary">{e.muscle}</Badge> : null}
                        {e.equipment ? <Badge variant="secondary">{e.equipment}</Badge> : null}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant={isFav ? "default" : "secondary"}
                      className="rounded-2xl"
                      onClick={() => toggleFavorite(e.id)}
                      title={isFav ? "Unfavorite" : "Favorite"}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
