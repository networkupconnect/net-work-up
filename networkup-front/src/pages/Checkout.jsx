import { useState } from "react";
import { useOutletContext, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Checkout() {
  const { cart = [], clearCart } = useOutletContext() || {};
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  if (!user) {
    localStorage.setItem("returnPath", "/checkout");
    return <Navigate to="/login" replace />;
  }

  if (cart.length === 0) {
    return (
      <div
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        className="min-h-[60vh] flex flex-col items-center justify-center gap-3"
      >
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <p className="text-[13px] text-black/40 font-medium">Nothing to checkout</p>
        <button onClick={() => navigate("/buy-sell")} className="text-[12px] font-semibold text-black underline underline-offset-2">
          Browse listings
        </button>
      </div>
    );
  }

  const total = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  const placeOrder = async () => {
    setError(null);
    const invalid = cart.find((i) => !i.sellerId || i.sellerId === "undefined");
    if (invalid) {
      setError("One or more items are invalid. Remove and re-add them.");
      return;
    }
    try {
      setPlacing(true);
      await api.post("/api/orders", {
        items: cart.map((i) => ({
          title: i.title,
          price: Number(i.price),
          quantity: i.quantity,
          sellerId: i.sellerId,
        })),
        totalAmount: total,
      });
      clearCart();
      localStorage.removeItem("returnPath");
      navigate("/order-success", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to place order. Try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#F7F5F2]">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F7F5F2]/90 backdrop-blur-sm border-b border-black/6 px-5 h-14 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/8 transition-colors">
          <svg className="w-4 h-4 text-black/60" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-[13px] font-semibold tracking-[0.08em] uppercase text-black/40">Checkout</span>
      </div>

      <div className="max-w-lg mx-auto px-5 py-5 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] px-4 py-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="px-4 py-3 border-b border-black/4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-black/30">Order Summary</p>
          </div>
          <div className="divide-y divide-black/4">
            {cart.map((item) => (
              <div key={item._id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {(item.images?.[0] || item.image) && (
                    <img
                      src={item.images?.[0] || item.image}
                      alt={item.title}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-black truncate">{item.title}</p>
                    <p className="text-[11px] text-black/30 mt-0.5">₹{item.price} × {item.quantity}</p>
                  </div>
                </div>
                <p className="text-[13px] font-bold text-black shrink-0">₹{Number(item.price) * item.quantity}</p>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-black/2 border-t border-black/4 flex items-center justify-between">
            <p className="text-[12px] font-semibold text-black/50">Total</p>
            <p className="text-xl font-bold text-black">₹{total}</p>
          </div>
        </div>

        {/* Delivery note */}
        <div className="bg-white rounded-2xl px-4 py-3 flex items-start gap-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[14px]">📦</span>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-black">Campus delivery</p>
            <p className="text-[11px] text-black/40 mt-0.5">The seller will reach out to you directly after the order is placed.</p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={placeOrder}
          disabled={placing}
          className="w-full py-3.5 bg-black text-white text-[13px] font-semibold rounded-xl hover:bg-black/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {placing ? "Placing order…" : `Place Order · ₹${total}`}
        </button>
      </div>
    </div>
  );
}