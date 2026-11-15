import { SectionCard } from "@/components/section-card";
import { HealthStatus } from "./health-status";

export function SystemStatusCard() {
  return (
    <SectionCard title="System status" description="Connection to the Cadence API.">
      <HealthStatus />
    </SectionCard>
  );
}
