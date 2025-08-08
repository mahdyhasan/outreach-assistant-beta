import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApolloUsage } from "@/hooks/use-apollo-usage";
import { useAuth } from "@/hooks/use-auth";
import { Search, BarChart3, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SmartHeaderRight() {
  const navigate = useNavigate();
  const { usage } = useApolloUsage();
  const { user, signOut } = useAuth();

  const initials = useMemo(() => {
    const email = user?.email || "";
    const namePart = email.split("@")[0];
    return namePart.slice(0, 2).toUpperCase() || "U";
  }, [user]);

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Lightweight search (navigates to Leads) */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-[55%]">
        <div className="relative w-full">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies or KDMs..."
            className="pl-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate("/leads");
            }}
          />
        </div>
      </div>

      {/* Apollo usage pill */}
      <div className="hidden md:flex items-center gap-2">
        <Badge variant="outline" className="gap-1">
          <BarChart3 className="h-3.5 w-3.5" />
          Apollo {usage ? `${usage.percentage_used}%` : "--%"}
        </Badge>
      </div>

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
