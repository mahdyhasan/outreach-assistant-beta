import { TopNavigation } from "./TopNavigation";
import { SmartHeaderRight } from "./SmartHeaderRight";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <header className="h-16 border-b bg-background px-4 md:px-6 flex items-center">
        <div className="flex w-full items-center gap-3">
          <div className="basis-[70%] max-w-[70%] overflow-x-auto">
            <TopNavigation />
          </div>
          <div className="basis-[30%] max-w-[30%] flex items-center justify-end">
            <SmartHeaderRight />
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}