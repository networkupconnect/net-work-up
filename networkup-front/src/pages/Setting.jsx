import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Setting() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();



  const [isSeller, setIsSeller] = useState(user?.role === "seller");
  const [loadingRole, setLoadingRole] = useState(false);

  const [pw, setPw] = useState({
    oldPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [loadingPw, setLoadingPw] = useState(false);

  const [message, setMessage] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsSeller(user.role === "seller");
  }, [user]);

  const showMessage = (msg, type = "success") => {
    setMessage({ msg, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // ================= ROLE TOGGLE =================
  const toggleRole = async () => {
    if (loadingRole) return;

    try {
      setLoadingRole(true);
      const newRole = isSeller ? "user" : "seller";

      const res = await api.put("/api/user/me/role", { role: newRole });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }

      updateUser(res.data.user);
      setIsSeller(res.data.user.role === "seller");
      showMessage(`Role changed to ${res.data.user.role}`);
    } catch (err) {
      showMessage(
        err?.response?.data?.message || "Failed to change role",
        "error"
      );
    } finally {
      setLoadingRole(false);
    }
  };

  // ================= CHANGE PASSWORD =================
  const changePassword = async (e) => {
    e.preventDefault();

    if (!pw.oldPassword || !pw.newPassword) {
      showMessage("All fields are required", "error");
      return;
    }

    if (pw.newPassword !== pw.confirm) {
      showMessage("Passwords do not match", "error");
      return;
    }

    try {
      setLoadingPw(true);

      await api.put("/api/user/me/password", {
        oldPassword: pw.oldPassword,
        newPassword: pw.newPassword,
      });

      showMessage("Password updated. Please login again.");

      setTimeout(() => {
        logout();
        navigate("/", { replace: true });
      }, 1000);
    } catch (err) {
      showMessage(err?.response?.data?.message || "Failed", "error");
    } finally {
      setLoadingPw(false);
    }
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="p-6 max-w-xl m-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Back
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success"
              ? "bg-blue-100 text-blue-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.msg}
        </div>
      )}

      {/* ROLE TOGGLE */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-4">Account Role</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current role</p>
            <p className="font-bold text-lg">{isSeller ? "Seller" : "User"}</p>
          </div>

          <button
            onClick={toggleRole}
            disabled={loadingRole}
            className={`relative w-14 h-8 rounded-full transition-colors duration-500 ease-in-out
              ${isSeller ? "bg-blue-600" : "bg-gray-300"}
              ${loadingRole ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow
                transition-transform duration-500 ease-in-out
                ${isSeller ? "translate-x-6" : "translate-x-0"}
              `}
            />
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Toggle to switch between User and Seller mode
        </p>
      </div>

      {/* CHANGE PASSWORD */}
      <form onSubmit={changePassword} className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Change Password</h2>

        <input
          type="password"
          placeholder="Old password"
          className="w-full p-2 mb-2 border rounded"
          onChange={(e) => setPw({ ...pw, oldPassword: e.target.value })}
        />

        <input
          type="password"
          placeholder="New password"
          className="w-full p-2 mb-2 border rounded"
          onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
        />

        <input
          type="password"
          placeholder="Confirm new password"
          className="w-full p-2 mb-3 border rounded"
          onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loadingPw}
        >
          {loadingPw ? "Saving..." : "Change Password"}
        </button>
      </form>

      {/* LOGOUT */}
      <div className="mt-6 text-center">
        {showLogoutConfirm ? (
          <div className="bg-gray-50 border border-gray-200 rounded p-4 inline-block">
            <p className="text-sm text-gray-700 mb-3">Are you sure you want to logout?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleLogout}
                className="bg-black text-white px-4 py-1.5 rounded hover:bg-gray-800 text-sm"
              >
                Yes, logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded hover:bg-gray-300 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}