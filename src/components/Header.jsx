import { Dumbbell } from "lucide-react";

export default function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white">
        <Dumbbell />
      </div>
      <div>
        <div className="text-lg font-semibold">Flexium</div>
        <div className="text-sm text-muted-foreground">
          Training. Progress. Discipline.
        </div>
      </div>
    </div>
  );
}
