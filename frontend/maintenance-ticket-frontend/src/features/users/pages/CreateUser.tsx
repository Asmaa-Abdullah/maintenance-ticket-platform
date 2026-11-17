import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import Input from "../../../components/common/Input";
import Select from "../../../components/common/Select";
import Modal from "../../../components/common/Modal";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/DataTable";

import { createUser } from "../services/userApi";
import type { User, UserRole, CreateUserRequest } from "../types/user";

const columns: DataTableColumn<User>[] = [
  { key: "employeeNumber", header: "Employee #" },
  { key: "fullName", header: "Full Name" },
  { key: "username", header: "Username" },
  { key: "role", header: "Role" },
  {
    key: "enabled",
    header: "Status",
    render: (user) => (
      <span className="font-medium text-green-600">
        {user.enabled ? "Active" : "Disabled"}
      </span>
    ),
  },
];

function CreateUser() {
  const navigate = useNavigate();

  const [employeeNumber, setEmployeeNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | "">("");

  const [createdUsers, setCreatedUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!role) return;

    setIsSaving(true);
    setError("");

    const request: CreateUserRequest = {
      employeeNumber,
      fullName,
      username,
      password,
      role,
    };

    try {
      const createdUser = await createUser(request);

      setCreatedUsers((currentUsers) => [createdUser, ...currentUsers]);

      setEmployeeNumber("");
      setFullName("");
      setUsername("");
      setPassword("");
      setRole("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create user:", error);
      setError("Failed to create user. Please try again.");
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => setIsModalOpen(false);

  const handleReset = () => {
    setEmployeeNumber("");
    setFullName("");
    setUsername("");
    setPassword("");
    setRole("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <Button
            type="button"
            variant="back"
            onClick={() => navigate("/users")}
          >
            ← Back to Users
          </Button>
        </div>

        <Card title="Create User" className="w-full max-w-none">
          <div className="mb-7">
            <p className="text-sm text-slate-500">
              Add a new user and assign their system role.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Information */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Employee Information
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Input
                  id="employeeNumber"
                  name="employeeNumber"
                  type="text"
                  label="Employee Number"
                  placeholder="Enter employee number"
                  value={employeeNumber}
                  onChange={(event) => setEmployeeNumber(event.target.value)}
                  required
                />

                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  label="Full Name"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Account Information */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Account Information
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  label="Username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />

                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Role */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                Permissions
              </h3>

              <Select
                id="role"
                name="role"
                label="User Role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as UserRole | "")
                }
                required
              >
                <option value="" disabled>
                  Select user role
                </option>
                <option value="ADMIN">Admin</option>
                <option value="INSPECTOR">Inspector</option>
                <option value="TECHNICIAN">Technician</option>
              </Select>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
              <Button type="button" variant="secondary" onClick={handleReset}>
                Clear Form
              </Button>

              <Button type="submit">Create User</Button>
            </div>
          </form>
        </Card>

        {createdUsers.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">
              Created Users
            </h2>

            <DataTable
              columns={columns}
              data={createdUsers}
              emptyMessage="No users created yet."
            />
          </div>
        )}

        <Modal
          open={isModalOpen}
          title="Confirm User Creation"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText="Save User"
          cancelText="Cancel"
          isLoading={isSaving}
        >
          <p>Are you sure you want to create this user?</p>
        </Modal>
      </div>
    </div>
  );
}

export default CreateUser;
