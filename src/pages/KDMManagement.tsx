import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KDMManagementContent } from "@/components/kdm/KDMManagementContent";

const KDMManagement = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            <KDMManagementContent />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default KDMManagement;