import { useState } from "react";
import { Dumbbell, LogOut, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { safeNum } from "@/lib/domain";

export default function Header({ activeUser, upsertUser, resetAll, signOut }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-background shadow-sm">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div>
          <div className="text-lg font-semibold">Flexium</div>
          <div className="text-sm text-muted-foreground">Log workouts, track progress, plan the next session.</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-2xl border bg-background px-3 py-2 text-sm">
          {activeUser?.name || "Account"} • {activeUser?.role || "trainee"}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="rounded-2xl">
              Settings
            </Button>
          </DialogTrigger>

          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Profile & settings</DialogTitle>
              <DialogDescription>Manage your account details and training preferences.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Active user</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        className="rounded-2xl"
                        value={activeUser.name}
                        onChange={(e) => upsertUser({ id: activeUser.id, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={activeUser.role} onValueChange={(v) => upsertUser({ id: activeUser.id, role: v })}>
                        <SelectTrigger className="rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trainee">trainee</SelectItem>
                          <SelectItem value="trainer">trainer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Weight unit</Label>
                      <Select
                        value={activeUser.settings.weightUnit}
                        onValueChange={(v) => upsertUser({ id: activeUser.id, settings: { ...activeUser.settings, weightUnit: v } })}
                      >
                        <SelectTrigger className="rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Recommendation step</Label>
                      <Input
                        className="rounded-2xl"
                        type="number"
                        value={activeUser.settings.plateIncrement}
                        onChange={(e) =>
                          upsertUser({
                            id: activeUser.id,
                            settings: { ...activeUser.settings, plateIncrement: safeNum(e.target.value) }
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border bg-muted/30 px-3 py-2">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">Show RPE field</div>
                      <div className="text-xs text-muted-foreground">Optional effort rating per set.</div>
                    </div>
                    <Switch
                      checked={!!activeUser.settings.showRPE}
                      onCheckedChange={(checked) =>
                        upsertUser({ id: activeUser.id, settings: { ...activeUser.settings, showRPE: checked } })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Danger zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="rounded-2xl" onClick={resetAll}>
                      <Settings className="mr-2 h-4 w-4" />
                      Reset all data
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Resetting removes your workouts, metrics, plans, and notes from the backend.
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" className="rounded-2xl" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
              <Button className="rounded-2xl" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
