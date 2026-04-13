import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Resources from "./pages/Resources";
import DashboardLayout from "./components/DashboardLayout.jsx";
import DashboardHome from "./pages/DashboardHome.jsx";
import BuySell from "./pages/BuySell.jsx";
import Profile from "./pages/Profile.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import Cart from "./pages/Cart.jsx";
import SellerDashboard from "./pages/seller/SellerDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Setting from "./pages/Setting.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PostsProvider } from "./context/PostsContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Chat from "./pages/Chat.jsx";
import Messages from "./pages/Messages.jsx";
import Connections from "./pages/Connections.jsx";
import Confessions from "./pages/Confessions";
import Internships from "./pages/Internships.jsx";
import Feedback from "./pages/Feedback.jsx";
import Assignments from "./pages/Assignments.jsx";
import RoomFinder from "./pages/RoomFinder.jsx";
import Attendance from "./pages/Attendance.jsx";
import OnboardingFlow from "./pages/OnboardingFlow.jsx";
import Course from "./pages/Course.jsx";

// ✅ FIX: Use lazy import so a missing/broken ExplorePage does NOT crash the
// entire app at startup — it will only error when that route is visited.
const ExplorePage = lazy(() =>
  import("./pages/Explorepage.jsx").catch((err) => {
    console.error("❌ [main.jsx] Failed to load ExplorePage:", err.message);
    // Fallback: render a simple "not found" div instead of crashing
    return { default: () => <div style={{ padding: 32 }}>Explore page not available.</div> };
  })
);

console.log("✅ [main.jsx] All imports ready, building router...");

const router = createBrowserRouter([
  // ── PUBLIC AUTH ──
  { path: "/login",  element: <AuthPage /> },
  { path: "/signup", element: <AuthPage /> },
  { path: "/Signup", element: <Navigate to="/signup" replace /> },

  // ── ONBOARDING ──
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute>
        <OnboardingFlow />
      </ProtectedRoute>
    ),
  },

  // ── CHAT (standalone) ──
  {
    path: "/chat/:userId",
    element: (
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    ),
  },

  // ── PROFILE (standalone) ──
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },

  // ── DASHBOARD LAYOUT ──
  {
    path: "/",
    element: <DashboardLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <DashboardHome /> },

      // ✅ ExplorePage wrapped in Suspense fallback so lazy load is safe
      {
        path: "explore",
        element: (
          <Suspense fallback={<div style={{ padding: 32, color: "#9ca3af" }}>Loading...</div>}>
            <ExplorePage />
          </Suspense>
        ),
      },

      { path: "resources",    element: <Resources /> },
      { path: "confessions",  element: <Confessions /> },
      { path: "messages",     element: <Messages /> },
      { path: "connections",  element: <Connections /> },
      { path: "Internships",  element: <Internships /> },
      { path: "assignments",  element: <Assignments /> },
      { path: "rooms",        element: <RoomFinder /> },
      { path: "buy-sell",     element: <BuySell /> },
      { path: "cart",         element: <Cart /> },
      { path: "checkout",     element: <Checkout /> },
      { path: "order-success", element: <OrderSuccess /> },
      { path: "user/:userId", element: <UserProfile /> },
      { path: "attendance",   element: <Attendance /> },
      { path: "course", element: <Course /> },

      {
        path: "feedback",
        element: (
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        ),
      },
      {
        path: "setting",
        element: (
          <ProtectedRoute>
            <Setting />
          </ProtectedRoute>
        ),
      },
      {
        path: "seller",
        element: (
          <ProtectedRoute roles={["seller", "admin"]}>
            <SellerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ── FALLBACK ──
  { path: "*", element: <NotFound /> },
]);

console.log("✅ [main.jsx] Router built, mounting React app...");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <PostsProvider>
        <RouterProvider router={router} />
      </PostsProvider>
    </AuthProvider>
  </React.StrictMode>,
);