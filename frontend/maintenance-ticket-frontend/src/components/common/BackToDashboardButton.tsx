import { useNavigate } from "react-router-dom";
import Button from "./Button";

function BackToDashboardButton() {
  const navigate = useNavigate();

  return (
    <Button type="button" variant="back" onClick={() => navigate("/dashboard")}>
      ← Back to Dashboard
    </Button>
  );
}
export default BackToDashboardButton;
