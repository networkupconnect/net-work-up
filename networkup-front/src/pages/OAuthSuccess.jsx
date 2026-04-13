import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));

    login({
      token,
      user: {
        _id: payload._id,
        name: payload.name,
        role: payload.role,
      },
    });

    navigate("/");
  }, []);

  return <p className="p-6">Logging you in...</p>;
}
