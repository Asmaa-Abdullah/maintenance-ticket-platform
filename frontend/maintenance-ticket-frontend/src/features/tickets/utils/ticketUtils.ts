export const getPriorityClass = (priority: string): string => {
  switch (priority) {
    case "HIGH":
      return "font-medium text-red-600";

    case "MEDIUM":
      return "font-medium text-amber-600";

    case "LOW":
      return "font-medium text-green-600";

    default:
      return "font-medium text-slate-600";
  }
};

export const formatTicketDate = (date: string): string => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
