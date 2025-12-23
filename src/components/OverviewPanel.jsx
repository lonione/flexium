import { Calendar, Dumbbell, History, LineChart, User } from "lucide-react";
import { ResponsiveContainer, LineChart as RLineChart, CartesianGrid, Line, XAxis, YAxis, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function Pill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border bg-background px-3 py-2 shadow-sm">
      <Icon className="h-4 w-4" />
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="ml-auto text-sm font-semibold">{value}</div>
    </div>
  );
}

export default function OverviewPanel({ activeUser, stats, metricChart }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <LineChart className="h-5 w-5" />
          Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Pill icon={History} label="Total workouts" value={stats.totalWorkouts} />
          <Pill icon={Calendar} label="This month" value={stats.workoutsThisMonth} />
          <Pill icon={Dumbbell} label="Volume this month" value={Math.round(stats.volThisMonth)} />
          <Pill icon={User} label="Active" value={activeUser?.name} />
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium">Body metrics</div>
          {metricChart.length === 0 ? (
            <div className="text-sm text-muted-foreground">Add body weight/body fat to see trends.</div>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RLineChart data={metricChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" dot={false} />
                </RLineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
