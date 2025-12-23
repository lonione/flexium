import { useState } from "react";
import { NotebookPen, Plus, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { safeNum, todayISO, uid } from "@/lib/domain";

export default function QuickAdd({ user, addMetric, addNote }) {
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const [note, setNote] = useState("");

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Save className="h-5 w-5" />
          Quick add
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <Label>Date</Label>
            <Input className="rounded-2xl" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Body weight ({user.settings.weightUnit})</Label>
            <Input className="rounded-2xl" inputMode="decimal" placeholder="e.g., 80.2" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Body fat (%)</Label>
            <Input className="rounded-2xl" inputMode="decimal" placeholder="e.g., 15.5" value={bf} onChange={(e) => setBf(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="rounded-2xl"
            onClick={() => {
              addMetric({ id: uid(), date, weight: safeNum(weight), bodyFat: safeNum(bf) });
              setWeight("");
              setBf("");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Save metrics
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Quick note</Label>
          <Textarea
            className="min-h-[84px] rounded-2xl"
            placeholder="How did today feel? Any aches, wins, or focus points…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={() => {
                const text = note.trim();
                if (!text) return;
                addNote({ id: uid(), date: todayISO(), text });
                setNote("");
              }}
            >
              <NotebookPen className="mr-2 h-4 w-4" />
              Add note
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
