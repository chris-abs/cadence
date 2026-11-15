import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you were looking for does not exist.</p>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
