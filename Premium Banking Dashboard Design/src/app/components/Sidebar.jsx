import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Search,
  Settings,
} from "lucide-react";

import { BrandLogo } from "./BrandLogo";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
  },
  {
    key: "search",
    label: "Recherche Client",
    icon: Search,
  },
  {
    key: "settings",
    label: "Paramètres",
    icon: Settings,
  },
];

function SidebarNavItem({
  active,
  collapsed,
  icon: Icon,
  label,
  onClick,
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition",
        active
          ? "bg-white/[0.08] text-white"
          : "text-white/72 hover:bg-white/[0.05] hover:text-white",
        collapsed ? "justify-center px-2" : "justify-start",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className={cn("size-5 shrink-0", active ? "text-[#E60028]" : "text-white/80")} />
      {!collapsed ? <span className="truncate">{label}</span> : null}
      {active && !collapsed ? <span className="ml-auto h-5 w-1 rounded-full bg-[#E60028]" /> : null}
    </button>
  );
}

export function Sidebar({
  activeItem,
  collapsed = false,
  managerLabel,
  onLogout,
  onNavigate,
  onToggleCollapse,
  showCollapseToggle = true,
}) {
  return (
    <div className="flex h-full flex-col bg-[#1A1A1A] text-white">
      <div
        className={cn(
          "flex items-center border-b border-white/[0.08] px-4 py-5",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <div className={cn("flex items-center overflow-hidden", collapsed && "justify-center")}>
          <BrandLogo
            compact={collapsed}
            imageClassName={collapsed ? "h-10 w-auto max-w-10" : "h-20 w-auto max-w-[11rem]"}
            withPlate={!collapsed}
          />
        </div>

        {showCollapseToggle && !collapsed ? (
          <Button
            className="h-9 w-9 rounded-lg border border-white/[0.08] bg-white/[0.04] p-0 text-white hover:bg-white/[0.08]"
            onClick={onToggleCollapse}
            type="button"
            variant="ghost"
          >
            <ChevronLeft className="size-4" />
          </Button>
        ) : null}

        {showCollapseToggle && collapsed ? (
          <Button
            className="h-9 w-9 rounded-lg border border-white/[0.08] bg-white/[0.04] p-0 text-white hover:bg-white/[0.08]"
            onClick={onToggleCollapse}
            type="button"
            variant="ghost"
          >
            <ChevronRight className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex-1 px-3 py-4">
        {!collapsed ? (
          <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/42">
              Gestionnaire
            </p>
            <p className="mt-2 truncate text-sm font-semibold text-white">
              {managerLabel || "Gestionnaire SGA"}
            </p>
          </div>
        ) : null}

        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.key}
              active={activeItem === item.key}
              collapsed={collapsed}
              icon={item.icon}
              label={item.label}
              onClick={() => onNavigate(item.key)}
            />
          ))}
        </nav>
      </div>

      <div className="border-t border-white/[0.08] px-3 py-4">
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-white/72 transition hover:bg-[#E60028]/12 hover:text-white",
            collapsed ? "justify-center px-2" : "justify-start",
          )}
          onClick={onLogout}
          type="button"
        >
          <LogOut className="size-5 shrink-0 text-[#E60028]" />
          {!collapsed ? <span>Déconnexion</span> : null}
        </button>
      </div>
    </div>
  );
}
