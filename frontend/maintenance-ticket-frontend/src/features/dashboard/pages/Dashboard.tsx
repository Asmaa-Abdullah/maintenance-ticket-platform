import { useEffect, useState } from "react";
import AppLayout from "../../../components/common/AppLayout";
import { getMe } from "../../auth/services/authApi";
import { getTicketCounts } from "../../tickets/services/ticketApi";
import type { TicketCounts } from "../../tickets/services/ticketApi";

interface CurrentUser {
  username: string;
  role: string | null;
}

function Dashboard() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState<TicketCounts>({
    open: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [userResponse, countsResponse] = await Promise.all([
          getMe(),
          getTicketCounts(),
        ]);

        setUser(userResponse);
        setCounts(countsResponse);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    {
      title: "Open Tickets",
      count: counts.open,
      description: "Tickets currently awaiting action",
    },
    {
      title: "Assigned Tickets",
      count: counts.assigned,
      description: "Tickets assigned to technicians",
    },
    {
      title: "In Progress",
      count: counts.inProgress,
      description: "Tickets currently being worked on",
    },
    {
      title: "Completed",
      count: counts.completed,
      description: "Successfully completed tickets",
    },
  ];

  return (
    <AppLayout>
      <div className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <section>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-800">
              {isLoading
                ? "Loading..."
                : `Welcome back, ${user?.username ?? "User"}`}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage maintenance tickets, assignments, and ongoing work from one
              place.
            </p>

            {!isLoading && user?.role && (
              <p className="mt-3 text-sm font-medium text-blue-600">
                Role: {user.role}
              </p>
            )}
          </section>

          <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-400">
                  {card.title}
                </p>

                <p className="mt-3 text-3xl font-semibold text-slate-800">
                  {isLoading ? "..." : card.count}
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  {card.description}
                </p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

export default Dashboard;
