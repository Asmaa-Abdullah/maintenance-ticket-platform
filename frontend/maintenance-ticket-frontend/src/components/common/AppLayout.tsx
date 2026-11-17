import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/authStore";
import { getMe } from "../../features/auth/services/authApi";

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await getMe();
        setRole(response.role);
      } catch (error) {
        console.error("Failed to load user role:", error);
      }
    };

    loadCurrentUser();
  }, []);

  const navigationItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      visible: true,
    },
    {
      label: "Tickets",
      path: "/tickets",
      visible: role === "ADMIN" || role === "INSPECTOR",
    },
    {
      label: "Assignments",
      path: "/assignments",
      visible: role === "ADMIN" || role === "TECHNICIAN",
    },
    {
      label: "Users",
      path: "/users",
      visible: role === "ADMIN",
    },
  ];

  const handleLogout = () => {
    clearAccessToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-6 py-5">
            <h1 className="text-lg font-semibold tracking-tight text-slate-800">
              Maintenance
            </h1>

            <p className="mt-1 text-xs text-slate-400">Ticket Platform</p>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="space-y-1">
              {navigationItems
                .filter((item) => item.visible)
                .map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
            </div>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="ml-64 min-h-screen">{children}</div>
    </div>
  );
}

export default AppLayout;
