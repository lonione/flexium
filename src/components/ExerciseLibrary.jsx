import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Star, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import EmptyState from "@/components/EmptyState";

export default function ExerciseLibrary({ user, exercises, addExercise, updateExercise, toggleFavorite }) {
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [equipment, setEquipment] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [editingId, setEditingId] = useState(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return exercises;
    return exercises.filter((e) => (e.name || "").toLowerCase().includes(query));
  }, [q, exercises]);

  const fav = new Set(user.favorites || []);
  const isEditing = Boolean(editingId);

  const startEdit = (exercise) => {
    setEditingId(exercise.id);
    setName(exercise.name || "");
    setEquipment(exercise.equipment || "");
    setGifUrl(exercise.gifUrl || "");
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEquipment("");
    setGifUrl("");
  };

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isEditing ? "Edit exercise" : "Exercises"}</CardTitle>
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
            <Label>{isEditing ? "Exercise name" : "New exercise"}</Label>
            <Input className="rounded-2xl" placeholder="e.g., Incline DB Press" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Equipment</Label>
            <Input className="rounded-2xl" placeholder="e.g., Dumbbell" value={equipment} onChange={(e) => setEquipment(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label>Exercise GIF URL</Label>
            <Input
              className="rounded-2xl"
              placeholder="https://example.com/exercise.gif"
              value={gifUrl}
              onChange={(e) => setGifUrl(e.target.value)}
            />
          </div>

          <div className="sm:col-span-3 flex flex-wrap items-center justify-end gap-2">
            {isEditing ? (
              <Button variant="secondary" className="rounded-2xl" onClick={resetForm}>
                <X className="mr-2 h-4 w-4" />
                Cancel edit
              </Button>
            ) : null}
            <Button
              className="rounded-2xl"
              onClick={() => {
                if (isEditing) {
                  updateExercise({ id: editingId, name, equipment, gifUrl });
                } else {
                  addExercise({ name, equipment, gifUrl });
                }
                resetForm();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {isEditing ? "Save changes" : "Add exercise"}
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
                        {e.equipment ? `${e.equipment}` : "No equipment listed"}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.gifUrl ? (
                          <a
                            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                            href={e.gifUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View GIF
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-2xl"
                        onClick={() => startEdit(e)}
                        title="Edit exercise"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
