import PortalProvider from "@/components/portal/PortalProvider";
import PortalShell from "@/components/portal/PortalShell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <PortalShell>{children}</PortalShell>
    </PortalProvider>
  );
}
