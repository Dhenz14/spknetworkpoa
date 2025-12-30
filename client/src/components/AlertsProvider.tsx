import { useAlerts } from "@/hooks/use-alerts";

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  useAlerts("demo_user", true);
  return <>{children}</>;
}
