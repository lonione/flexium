import Header from "@/components/Header";

export default function App() {
  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <Header />
      <div className="mt-6 text-muted-foreground">
        Flexium is ready. All files are split and wired.
        You can now iterate safely and push to GitHub.
      </div>
    </div>
  );
}
