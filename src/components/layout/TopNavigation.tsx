import { NavLink } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { 
  Activity, 
  Database, 
  Target, 
  Download, 
  Users, 
  BarChart3, 
  Settings 
} from "lucide-react";

export function TopNavigation() {
  return (
    <NavigationMenu className="max-w-none w-full">
      <NavigationMenuList className="flex items-center space-x-4">
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`
              }
            >
              <Activity className="h-4 w-4" />
              Dashboard
            </NavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Lead
          </NavigationMenuTrigger>
          <NavigationMenuContent className="z-[60] bg-popover border shadow-md">
            <ul className="grid w-[200px] gap-2 p-4">
              <li>
                <NavigationMenuLink asChild>
                  <NavLink
                    to="/leads"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <div className="text-sm font-medium leading-none">Lead Management</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Manage and track leads
                    </p>
                  </NavLink>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <NavLink
                    to="/mining"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <div className="text-sm font-medium leading-none">Lead Mining</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Mine and discover leads
                    </p>
                  </NavLink>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <NavLink
                    to="/export"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <div className="text-sm font-medium leading-none">Export Leads</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Export lead data
                    </p>
                  </NavLink>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            KDM
          </NavigationMenuTrigger>
          <NavigationMenuContent className="z-[60] bg-popover border shadow-md">
            <ul className="grid w-[200px] gap-2 p-4">
              <li>
                <NavigationMenuLink asChild>
                  <NavLink
                    to="/kdm"
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  >
                    <div className="text-sm font-medium leading-none">Management</div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      Manage key decision makers
                    </p>
                  </NavLink>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>


        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <NavLink 
              to="/analytics" 
              className={({ isActive }) => 
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`
              }
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </NavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <NavLink 
              to="/settings" 
              className={({ isActive }) => 
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`
              }
            >
              <Settings className="h-4 w-4" />
              Settings
            </NavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}