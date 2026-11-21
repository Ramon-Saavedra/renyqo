import { ProviderWorkspaceBoundary } from "@/features/provider/workspaces/ProviderWorkspaceBoundary";
import { RealtimeProvider } from "@/components/realtime/RealtimeProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider>
      <ProviderWorkspaceBoundary>{children}</ProviderWorkspaceBoundary>
    </RealtimeProvider>
  );
}
