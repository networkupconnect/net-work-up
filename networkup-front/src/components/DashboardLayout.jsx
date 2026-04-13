import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Navbar from "../pages/Navbar.jsx";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (!savedCart || savedCart === "undefined" || savedCart === "null") return [];
      return JSON.parse(savedCart);
    } catch {
      localStorage.removeItem("cart");
      return [];
    }
  });

  const [showPopup, setShowPopup] = useState(false);
  const [products, setProducts] = useState([]);
  const [authMsg, setAuthMsg] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    try { localStorage.setItem("cart", JSON.stringify(cart)); } catch {}
  }, [cart]);

  const hamBurger = () => setIsSidebarOpen((prev) => !prev);
  const getItemId = (item) => item._id || item.id;
  const clearCart = () => { setCart([]); localStorage.removeItem("cart"); };

  const addToCart = (product) => {
    if (!product.sellerId) { alert("This product cannot be added to cart"); return; }
    setCart((prev) => {
      const productId = getItemId(product);
      const existing = prev.find((item) => getItemId(item) === productId);
      if (existing)
        return prev.map((item) =>
          getItemId(item) === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      return [...prev, { _id: product._id, title: product.title, price: product.price, image: product.image, quantity: 1, sellerId: product.sellerId }];
    });
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  const increaseQty = (id) =>
    setCart((prev) => prev.map((item) => getItemId(item) === id ? { ...item, quantity: item.quantity + 1 } : item));
  const decreaseQty = (id) =>
    setCart((prev) =>
      prev.map((item) => getItemId(item) === id ? { ...item, quantity: item.quantity - 1 } : item)
          .filter((item) => item.quantity > 0)
    );

  const showAuthToast = (msg) => {
    setAuthMsg(msg);
    setTimeout(() => setAuthMsg(null), 3000);
  };

  // ── Desktop sidebar links (unchanged) ──────────────────────────────────────
  const allLinks1 = [
    { name: "Home",        path: "/",            imgsrc: "/images/home.svg",        authType: null },
    ...(user ? [{ name: "Connections", path: "/connections", imgsrc: "/images/connections.svg", authType: null }] : []),
    { name: "Shop",        path: "/buy-sell",    imgsrc: "/images/cart.svg",        authType: null },
    { name: "Attendance",  path: "/attendance",  imgsrc: "/images/attendance.svg",  authType: "profile" },
    { name: "Chat",        path: "/messages",    imgsrc: "/images/chat.svg",        authType: null },
  ];

  
  const allLinks2 = [
    { name: "Rooms",        path: "/rooms",       imgsrc: "/images/room.svg",        authType: null },
    { name: "Internships",  path: "/Internships", imgsrc: "/images/alert.svg",       authType: null },
    { name: "Confessions",  path: "/confessions", imgsrc: "/images/inc.svg",         authType: null },
    { name: "PYQS & Notes", path: "/resources",   imgsrc: "/images/book.svg",        authType: "profile" },
    { name: "Assignments",  path: "/assignments", imgsrc: "/images/assignment.svg",  authType: "profile" },
    { name: "Feedback",     path: "/feedback",    imgsrc: "/images/feedback.svg",    authType: "login" },
    { name: "Course",       path: "/course",      imgsrc: "/images/course.svg",      authType: null },
    ...(user && (user.role === "seller" || user.role === "admin")
      ? [{ name: "Seller Dashboard", path: "/seller", imgsrc: "/images/seller-cart.svg", authType: null }]
      : []),
    ...(user && user.role === "admin"
      ? [{ name: "Admin Dashboard", path: "/admin", imgsrc: "/images/admin.svg", authType: null }]
      : []),
  ];

  // ── Mobile bottom nav — 5 fixed tabs including Explore ────────────────────
  const mobileNavTabs = [
    { name: "Home",     path: "/",         imgsrc: "/images/home.svg"  },
    { name: "Shop",     path: "/buy-sell", imgsrc: "/images/cart.svg"  },
    { name: "Explore",  path: "/explore",  imgsrc: null                }, // compass icon rendered inline
    { name: "Connect",  path: "/connections", imgsrc: "/images/connections.svg" },
    { name: "Profile",  path: "/profile",  imgsrc: "/images/profile.svg" },
  ];

  const handleNavClick = (e, link) => {
    if (!link.authType) return;
    if (!user) {
      e.preventDefault();
      showAuthToast(
        link.authType === "profile"
          ? " Please setup your profile first — add Branch, Year & Section"
          : " Please login first to access this feature"
      );
      return;
    }
    if (link.authType === "profile" && (!user.branch || !user.year || !user.section)) {
      e.preventDefault();
      showAuthToast(" Please setup your profile first — add Branch, Year & Section");
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 transition-colors ${
      isActive ? "bg-blue-100 font-semibold text-black" : "hover:bg-gray-200"
    }`;

  return (
    <div className="overflow-hidden relative h-screen flex flex-col">
      <Navbar />

      {authMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl border border-zinc-700 max-w-xs text-center">
          {authMsg}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden sm:flex flex-col w-44 shrink-0 bg-gray-100 overflow-y-auto">
          <div className="flex flex-col p-2 gap-0.5">
            {allLinks1.map((link) => (
              <NavLink key={link.name} to={link.path} onClick={(e) => handleNavClick(e, link)} className={navLinkClass}>
                <img className={`w-5 h-5 shrink-0 ${link.name === "My Profile" ? "rounded-full object-cover" : ""}`} src={link.imgsrc} alt="" />
                <span className="truncate">{link.name}</span>
              </NavLink>
            ))}
          </div>
          <div className="border-t border-gray-300 mx-2 my-1" />
          <div className="flex flex-col p-2 pb-8 gap-0.5">
            {allLinks2.map((link) => (
              <NavLink key={link.name} to={link.path} onClick={(e) => handleNavClick(e, link)} className={navLinkClass}>
                <img className="w-5 h-5 shrink-0" src={link.imgsrc} alt="" />
                <span className="truncate">{link.name}</span>
              </NavLink>
            ))}
          </div>
        </aside>

        {/* ── Mobile bottom nav — 5 tabs, no More/drawer ──────────────────── */}
        {/* Replace the existing mobile bottom nav JSX with this: */}
<div className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-1">
  {mobileNavTabs.map((tab) =>
    tab.name === "Explore" ? (
      <NavLink
        key="Explore"
        to="/explore"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center flex-1 py-1 gap-0.5 ${
            isActive ? "text-blue-600" : "text-gray-500"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-colors ${
                isActive ? "bg-blue-100" : "bg-gray-100"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
              </svg>
            </span>
            {/* Active: black text, inactive: gray */}
            <span className={`text-[10px] leading-tight ${isActive ? "text-black font-semibold" : "text-gray-500"}`}>
              Explore
            </span>
          </>
        )}
      </NavLink>
    ) : (
      <NavLink
        key={tab.name}
        to={tab.path}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center gap-0.5 flex-1 py-1 ${
            isActive ? "text-blue-600" : "text-gray-500"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <img className="w-5 h-5" src={tab.imgsrc} alt="" />
            {/* Active: black text, inactive: gray */}
            <span className={`text-[10px] leading-tight text-center truncate w-full px-0.5 ${
              isActive ? "text-black font-semibold" : "text-gray-500"
            }`}>
              {tab.name}
            </span>
          </>
        )}
      </NavLink>
    )
  )}
</div>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-white hide-scrollbar pb-16 sm:pb-0">
          <Outlet
            context={{
              cart, addToCart, increaseQty, decreaseQty,
              products, setProducts, clearCart,
            }}
          />
        </main>
      </div>
    </div>
  );
}