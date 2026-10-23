import { RealtimeProvider } from "@/components/realtime/RealtimeProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <RealtimeProvider>{children}</RealtimeProvider>;
}
