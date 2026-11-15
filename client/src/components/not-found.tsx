import { Link } from "@tanstack/react-router";
import { CenteredLayout } from "@/components/centered-layout";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <CenteredLayout
      title="Page not found"
      description="The page you were looking for does not exist."
    >
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </CenteredLayout>
  );
}
