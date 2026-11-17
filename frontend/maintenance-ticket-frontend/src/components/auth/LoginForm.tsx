import { useState } from "react";
import Input from "../common/Input";
import Button from "../common/Button";
import Card from "../common/Card";
import { login } from "../../features/auth/services/authApi";
import { useAuthStore } from "../../features/auth/store/authStore";
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      console.log("LOGIN DATA:", {
        username,
        passwordLength: password.length,
      });
      const response = await login({
        username,
        password,
      });

      setAccessToken(response.accessToken);

      navigate("/dashboard");

      console.log("Login successful");
    } catch (error) {
      console.error(error);
      setError("Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Login">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="username"
          name="username"
          type="text"
          label="Username"
          placeholder="Enter your username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={isLoading}
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default LoginForm;
