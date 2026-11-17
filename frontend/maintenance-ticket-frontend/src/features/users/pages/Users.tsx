import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Ban } from "lucide-react";
import Modal from "../../../components/common/Modal";

import DataTable, {
  type DataTableColumn,
} from "../../../components/common/DataTable";
import Button from "../../../components/common/Button";
import SearchInput from "../../../components/common/SearchInput";
import BackToDashboardButton from "../../../components/common/BackToDashboardButton";
import type { User } from "../types/user";
import { disableUser, getAllUsers } from "../services/userApi";

const columns = (
  onEdit: (user: User) => void,
  onDisable: (user: User) => void,
): DataTableColumn<User>[] => [
  {
    key: "employeeNumber",
    header: "Employee #",
  },
  {
    key: "fullName",
    header: "Full Name",
  },
  {
    key: "username",
    header: "Username",
  },
  {
    key: "role",
    header: "Role",
  },
  {
    key: "enabled",
    header: "Status",
    render: (user) => (
      <span
        className={
          user.enabled
            ? "font-medium text-green-600"
            : "font-medium text-red-600"
        }
      >
        {user.enabled ? "Active" : "Disabled"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    render: (user) => (
      <div className="flex items-center gap-2">
        <Button type="button" variant="success" onClick={() => onEdit(user)}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>

        <Button
          type="button"
          variant="danger"
          disabled={!user.enabled}
          onClick={() => onDisable(user)}
        >
          <Ban className="h-4 w-4" />
          Disable
        </Button>
      </div>
    ),
  },
];

function Users() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userToDisable, setUserToDisable] = useState<User | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getAllUsers();
        setUsers(data.filter((user) => user.enabled));
      } catch (error) {
        console.error("Failed to load users:", error);
        setError("Failed to load users. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleConfirmDisable = async () => {
    if (!userToDisable) {
      return;
    }

    try {
      setIsDisabling(true);
      setError("");

      await disableUser(userToDisable.id);

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== userToDisable.id),
      );

      setUserToDisable(null);
    } catch (error) {
      console.error("Failed to disable user:", error);
      setError("Failed to disable user. Please try again.");
    } finally {
      setIsDisabling(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchValue = search.toLowerCase();

    return (
      user.fullName.toLowerCase().includes(searchValue) ||
      user.username.toLowerCase().includes(searchValue) ||
      user.employeeNumber.toLowerCase().includes(searchValue)
    );
  });

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-800">
              Users
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              View and manage system users.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <BackToDashboardButton />
        </div>

        <div className="mt-8 flex items-center gap-10 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users..."
          />

          <Button type="button" onClick={() => navigate("/users/create")}>
            <span className="text-lg leading-none">+</span>
            Create User
          </Button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6">
          <DataTable
            columns={columns(
              (user) => navigate(`/users/${user.id}/edit`),
              (user) => setUserToDisable(user),
            )}
            data={isLoading ? [] : filteredUsers}
            emptyMessage={isLoading ? "Loading users..." : "No users found."}
          />
        </div>
      </div>

      <Modal
        open={userToDisable !== null}
        title="Confirm User Deactivation"
        onConfirm={handleConfirmDisable}
        onCancel={() => setUserToDisable(null)}
        confirmText="Disable User"
        cancelText="Cancel"
        isLoading={isDisabling}
      >
        <p>
          Are you sure you want to disable{" "}
          <span className="font-semibold text-slate-800">
            {userToDisable?.fullName}
          </span>
          ?
        </p>
      </Modal>
    </div>
  );
}

export default Users;
