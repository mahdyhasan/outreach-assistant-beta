import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SmartHeaderRight() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const initials = useMemo(() => {
    const email = user?.email || "";
    const namePart = email.split("@")[0];
    return namePart.slice(0, 2).toUpperCase() || "U";
  }, [user]);

  return (
    <div className="flex items-center gap-3 w-full justify-end">

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[60] bg-popover border shadow-lg">
          <DropdownMenuLabel className="max-w-[220px] truncate">{user?.email || "User"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/settings")}> 
            <Settings className="mr-2 h-4 w-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
