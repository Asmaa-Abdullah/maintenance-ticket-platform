import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import Input from "../../../components/common/Input";
import Select from "../../../components/common/Select";
import Button from "../../../components/common/Button";

import type { User, UserRole, UpdateUserRequest } from "../types/user";
import { getUserById, updateUser } from "../services/userApi";

function EditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | "">("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        setError("Invalid user ID.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const data = await getUserById(Number(id));

        setUser(data);
        setFullName(data.fullName);
        setUsername(data.username);
        setRole(data.role);
      } catch (error) {
        console.error("Failed to load user:", error);
        setError("Failed to load user. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [id]);

  const handleSave = async () => {
    if (!id || !role) {
      return;
    }

    const request: UpdateUserRequest = {
      employeeNumber: user!.employeeNumber,
      fullName,
      username,
      role,
      ...(password.trim() ? { password } : {}),
    };

    try {
      setIsSaving(true);
      setError("");

      await updateUser(Number(id), request);

      navigate("/users");
    } catch (error) {
      console.error("Failed to update user:", error);
      setError("Failed to update user. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/users");
  };

  if (isLoading) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-sm text-slate-500">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-6 py-10">
        <div className="mx-auto w-full max-w-5xl">
          <p className="mb-4 text-sm text-red-600">
            {error || "User not found."}
          </p>

          <Button type="button" variant="back" onClick={handleCancel}>
            ← Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <Button type="button" variant="back" onClick={handleCancel}>
            ← Back
          </Button>
        </div>

        <Card title="Edit User" className="w-full max-w-none">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            <Input
              label="Employee Number"
              value={user.employeeNumber}
              disabled
              className="disabled:border-blue-200 disabled:bg-blue-50 disabled:font-medium disabled:text-blue-700 disabled:opacity-100"
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input
                id="fullName"
                name="fullName"
                type="text"
                label="Full Name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />

              <Input
                id="username"
                name="username"
                type="text"
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="New Password"
                placeholder="Leave blank to keep current password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <Select
                id="role"
                name="role"
                label="Role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as UserRole | "")
                }
                required
              >
                <option value="" disabled>
                  Select role
                </option>

                <option value="ADMIN">Admin</option>
                <option value="INSPECTOR">Inspector</option>
                <option value="TECHNICIAN">Technician</option>
              </Select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default EditUser;
