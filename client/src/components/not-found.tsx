import { Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <Page title="Page not found" description="The page you were looking for does not exist.">
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </Page>
  );
}
