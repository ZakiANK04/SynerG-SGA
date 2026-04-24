import { useEffect, useState } from "react";
import { LayoutGrid, LogOut, Map, Search, Settings } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { BrandLogo } from "./BrandLogo";
import { Sidebar } from "./Sidebar";
import { Button } from "./ui/button";
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
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const activeItem =
    location.pathname === "/settings"
      ? "settings"
      : location.pathname === "/cartography"
        ? "cartography"
      : new URLSearchParams(location.search).get("focus") === "search"
        ? "search"
        : "dashboard";

  function handleNavigate(target) {
    if (target === "dashboard") {
      navigate("/dashboard");
    } else if (target === "cartography") {
      navigate("/cartography");
    } else if (target === "search") {
      navigate("/dashboard?focus=search");
    } else if (target === "settings") {
      navigate("/settings");
    }
  }

  function handleLogout() {
    logout();
  }

  const mobileNavItems = [
    { key: "dashboard", label: "Accueil", icon: LayoutGrid },
    { key: "cartography", label: "Carte", icon: Map },
    { key: "search", label: "Recherche", icon: Search },
    { key: "settings", label: "Parametres", icon: Settings },
    { key: "logout", label: "Sortie", icon: LogOut },
  ];

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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-center border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur lg:hidden">
          <BrandLogo imageClassName="h-[3.3rem] w-auto max-w-[13.2rem]" />
        </header>

        <main className="min-h-screen overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/96 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key !== "logout" && activeItem === item.key;

            return (
              <button
                key={item.key}
                className={`flex min-h-[64px] flex-col items-center justify-center rounded-2xl px-2 py-2 text-center text-[11px] font-semibold transition ${
                  isActive
                    ? "bg-[#FFF1F3] text-[#E60028]"
                    : "text-[#6B7280] hover:bg-slate-100 hover:text-[#111827]"
                }`}
                onClick={() => {
                  if (item.key === "logout") {
                    handleLogout();
                    return;
                  }

                  handleNavigate(item.key);
                }}
                type="button"
              >
                <Icon className={`mb-1 size-5 ${isActive ? "text-[#E60028]" : "text-current"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
