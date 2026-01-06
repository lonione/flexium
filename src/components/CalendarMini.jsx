import { useMemo, useState } from "react";
import { Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { daysInMonth, todayISO, weekdayIndex } from "@/lib/domain";

export default function CalendarMini({ workoutsByDate, plansByDate }) {
  const initial = useMemo(() => {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth(); // month index since year 0
  }, []);
  const [monthIndex, setMonthIndex] = useState(initial);

  const first = useMemo(() => {
    const year = Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-01`;
  }, [monthIndex]);
  const dim = useMemo(() => daysInMonth(first), [first]);
  const offset = useMemo(() => weekdayIndex(first), [first]);
  const changeMonth = (delta) => setMonthIndex((prev) => prev + delta);

  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= dim; d++) {
      const date = new Date(first + "T00:00:00");
      date.setDate(d);
      out.push(date.toISOString().slice(0, 10));
    }
    return out;
  }, [first, dim, offset]);

  const title = useMemo(() => {
    const d = new Date(first + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [first]);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="rounded-2xl" onClick={() => changeMonth(-1)}>
              Prev
            </Button>
            <Button size="sm" variant="secondary" className="rounded-2xl" onClick={() => changeMonth(1)}>
              Next
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 text-sm font-medium">{title}</div>
        <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
            <div key={w} className="px-1 py-1 text-center">
              {w}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((iso, idx) => {
            if (!iso) return <div key={idx} className="h-10" />;
            const day = Number(iso.slice(8));
            const wCount = workoutsByDate.get(iso) || 0;
            const pCount = plansByDate.get(iso) || 0;
            const isToday = iso === todayISO();
            return (
              <div
                key={iso}
                className={`h-10 rounded-2xl border bg-background px-2 py-1 text-sm shadow-sm ${isToday ? "ring-2 ring-primary/40" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium">{day}</div>
                  <div className="flex gap-1">
                    {pCount ? (
                      <Badge variant="secondary" className="h-5 px-2">
                        P
                      </Badge>
                    ) : null}
                    {wCount ? <Badge className="h-5 px-2">W</Badge> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Badge className="h-5 px-2">W</Badge>
            Workout logged
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="h-5 px-2">
              P
            </Badge>
            Plan created
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
