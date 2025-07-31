import { TopNavigation } from "./TopNavigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <header className="h-16 border-b bg-background px-6 flex items-center">
        <TopNavigation />
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}