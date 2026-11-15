import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthStatus } from "@/features/system";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Welcome to Cadence</h1>
      <Card>
        <CardHeader>
          <CardTitle>System status</CardTitle>
          <CardDescription>Connection to the Cadence API.</CardDescription>
        </CardHeader>
        <CardContent>
          <HealthStatus />
        </CardContent>
      </Card>
    </div>
  );
}
