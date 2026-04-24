import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { BrandLogo } from "./BrandLogo";
import { Sidebar } from "./Sidebar";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useAuth } from "../lib/auth.jsx";

const SIDEBAR_STORAGE_KEY = "synerg-sidebar-collapsed";

function readSidebarState() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, session } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarState);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const activeItem =
    location.pathname === "/settings"
      ? "settings"
      : new URLSearchParams(location.search).get("focus") === "search"
        ? "search"
        : "dashboard";

  function handleNavigate(target) {
    if (target === "dashboard") {
      navigate("/dashboard");
    } else if (target === "search") {
      navigate("/dashboard?focus=search");
    } else if (target === "settings") {
      navigate("/settings");
    }

    setMobileSidebarOpen(false);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 bg-[#1A1A1A] transition-[width] duration-300 lg:block ${
          sidebarCollapsed ? "w-[88px]" : "w-[272px]"
        }`}
      >
        <Sidebar
          activeItem={activeItem}
          collapsed={sidebarCollapsed}
          managerLabel={session?.name || session?.managerName}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
        />
      </aside>

      <div
        className={`min-h-screen transition-[padding-left] duration-300 ${
          sidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[272px]"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:hidden">
          <Sheet onOpenChange={setMobileSidebarOpen} open={mobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-0 text-[#111827] hover:bg-slate-50"
                type="button"
                variant="outline"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[280px] border-r border-white/10 bg-[#1A1A1A] p-0" side="left">
              <Sidebar
                activeItem={activeItem}
                collapsed={false}
                managerLabel={session?.name || session?.managerName}
                onLogout={handleLogout}
                onNavigate={handleNavigate}
                showCollapseToggle={false}
              />
            </SheetContent>
          </Sheet>

          <BrandLogo imageClassName="h-10 w-auto" />

          <div className="w-10 shrink-0" />
        </header>

        <main className="min-h-screen overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
