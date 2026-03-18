import { Outlet } from "react-router";
import { useAuth, logout } from "wasp/client/auth";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Sprout,
  Grid3X3,
  CalendarDays,
  CheckSquare,
  Flower2,
  Apple,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import "./App.css";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/plants", label: "Plants", icon: Sprout },
  { path: "/seeds", label: "Seeds", icon: Flower2 },
  { path: "/garden", label: "Garden", icon: Grid3X3 },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/harvest", label: "Harvest", icon: Apple },
  { path: "/settings", label: "Settings", icon: Settings },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block">
      <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6">
        <Sprout className="h-7 w-7 text-primary-600" />
        <span className="text-xl font-bold text-neutral-900">GardenDo</span>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const active =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-neutral-200 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-neutral-200 bg-white lg:hidden">
      {navItems.slice(0, 5).map((item) => {
        const active =
          item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
              active ? "text-primary-600" : "text-neutral-500"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <Sprout className="h-6 w-6 text-primary-600" />
        <span className="text-lg font-bold text-neutral-900">GardenDo</span>
      </div>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100"
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {menuOpen && (
        <div className="absolute top-14 right-0 left-0 z-50 border-b border-neutral-200 bg-white p-4 shadow-lg">
          <Link
            to="/seeds"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            <Flower2 className="h-5 w-5" />
            Seeds
          </Link>
          <Link
            to="/settings"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <button
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}

export function App() {
  const { data: user } = useAuth();

  if (!user) {
    return (
      <main className="flex min-h-screen w-full flex-col bg-neutral-50 text-neutral-800">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-800">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 pb-16 lg:pb-0">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
