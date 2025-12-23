import { useState } from "react";
import { NotebookPen, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import EmptyState from "@/components/EmptyState";
import { todayISO, uid } from "@/lib/domain";

export default function Notes({ notes, addNote, deleteNote }) {
  const [text, setText] = useState("");

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>New note</Label>
            <Textarea
              className="min-h-[110px] rounded-2xl"
              placeholder="Write anything: technique cues, soreness, goals…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              className="rounded-2xl"
              onClick={() => {
                const t = text.trim();
                if (!t) return;
                addNote({ id: uid(), date: todayISO(), text: t });
                setText("");
              }}
            >
              <NotebookPen className="mr-2 h-4 w-4" />
              Add note
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {notes.length === 0 ? (
            <EmptyState title="No notes yet" subtitle="Add your first note above." />
          ) : (
            notes.map((n) => (
              <div key={n.id} className="rounded-2xl border bg-background p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{n.date}</div>
                    <div className="whitespace-pre-wrap text-sm">{n.text}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="rounded-2xl" onClick={() => deleteNote(n.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
