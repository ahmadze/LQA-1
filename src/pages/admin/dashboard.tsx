import { Sidebar, SidebarContent, SidebarProvider, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Users, CalendarDays, ListChecks } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable";
import { useState } from "react";
import UsersPanel from "./components/users-panel";
import MeetingsPanel from "./components/meetings-panel";
import RegistrationsPanel from "./components/registrations-panel";

// These will be our admin panels
const PANELS = {
  USERS: "users",
  MEETINGS: "meetings",
  REGISTRATIONS: "registrations"
} as const;

type PanelType = typeof PANELS[keyof typeof PANELS];

export default function AdminDashboard() {
  const [activePanel, setActivePanel] = useState<PanelType>(PANELS.USERS);

  return (
    <SidebarProvider defaultOpen>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <Sidebar className="bg-primary text-primary-foreground">
            <SidebarHeader className="border-b border-primary-foreground/10 px-6 py-4">
              <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActivePanel(PANELS.USERS)}
                    isActive={activePanel === PANELS.USERS}
                    className="hover:text-white/80"
                  >
                    <Users />
                    <span>Users</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActivePanel(PANELS.MEETINGS)}
                    isActive={activePanel === PANELS.MEETINGS}
                    className="hover:text-white/80"
                  >
                    <CalendarDays />
                    <span>Meetings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActivePanel(PANELS.REGISTRATIONS)}
                    isActive={activePanel === PANELS.REGISTRATIONS}
                    className="hover:text-white/80"
                  >
                    <ListChecks />
                    <span>Registrations</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
        </ResizablePanel>

        <ResizablePanel defaultSize={80}>
          <div className="h-screen overflow-y-auto p-8 bg-primary text-primary-foreground">
            {activePanel === PANELS.USERS && <UsersPanel />}
            {activePanel === PANELS.MEETINGS && <MeetingsPanel />}
            {activePanel === PANELS.REGISTRATIONS && <RegistrationsPanel />}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </SidebarProvider>
  );
}