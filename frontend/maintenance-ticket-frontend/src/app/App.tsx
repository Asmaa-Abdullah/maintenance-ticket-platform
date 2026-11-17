import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../features/auth/pages/Login";
import Dashboard from "../features/dashboard/pages/Dashboard";
import Tickets from "../features/tickets/pages/Tickets";
import CreateTicket from "../features/tickets/pages/CreateTicket";
import ProtectedRoute from "../components/common/ProtectedRoute";
import EditTicket from "../features/tickets/pages/EditTicket";
import Users from "../features/users/pages/Users";
import CreateUser from "../features/users/pages/CreateUser";
import EditUser from "../features/users/pages/EditUser";
import Assignments from "../features/assignments/pages/Assignments";
import AssignedTickets from "../features/assignments/pages/AssignedTickets";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/create-ticket" element={<CreateTicket />} />
        <Route path="/tickets/:id/edit" element={<EditTicket />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/create" element={<CreateUser />} />
        <Route path="/users/:id/edit" element={<EditUser />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/assigned-tickets" element={<AssignedTickets />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
