import { useState } from "react";
import { LogIn, Mail, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSignIn = async () => {
    setBusy(true);
    setStatus("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
    }
    setBusy(false);
  };

  const handleSignUp = async () => {
    setBusy(true);
    setStatus("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Check your email to confirm your account.");
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sign in to Flexium</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              className="rounded-2xl"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              className="rounded-2xl"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {status ? <div className="rounded-2xl border border-border/60 bg-muted/40 px-3 py-2 text-xs">{status}</div> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="w-full rounded-2xl" onClick={handleSignIn} disabled={busy || !email || !password}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </Button>
            <Button
              variant="secondary"
              className="w-full rounded-2xl"
              onClick={handleSignUp}
              disabled={busy || !email || !password}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Sign up
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-4 w-4" />
            Use the email you want to link to your workouts.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
