import { useEffect, useState, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

function StatusBadge({ status = "pending" }) {
  const map = {
    pending:   { bg: "bg-amber-50",   text: "text-amber-600",  border: "border-amber-200"  },
    confirmed: { bg: "bg-blue-50",    text: "text-blue-600",   border: "border-blue-200"   },
    delivered: { bg: "bg-emerald-50", text: "text-emerald-600",border: "border-emerald-200"},
    cancelled: { bg: "bg-red-50",     text: "text-red-500",    border: "border-red-200"    },
  };
  const s = map[status] || { bg: "bg-black/5", text: "text-black/40", border: "border-black/10" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${s.bg} ${s.text} ${s.border}`}>
      {status}
    </span>
  );
}

const MAX_IMAGES = 5;

export default function SellerDashboard() {
  const { products = [], setProducts } = useOutletContext() || {};
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle]     = useState("");
  const [price, setPrice]     = useState("");
  const [images, setImages]   = useState([]); // array of File objects
  const [previews, setPreviews] = useState([]); // array of object URLs
  const fileInputRef = useRef(null);

  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [toast, setToast]     = useState(null);

  const sellerId = user?._id;

  useEffect(() => {
    if (!sellerId) return;
    api.get("/api/seller/products")
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Products load error:", err));
  }, [sellerId, setProducts]);

  useEffect(() => {
    if (!sellerId) return;
    api.get("/api/seller/orders")
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Orders load error:", err))
      .finally(() => setOrdersLoading(false));
  }, [sellerId]);

  if (!user || user.role !== "seller") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-[13px] text-black/40">Access restricted to sellers.</p>
      </div>
    );
  }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const myProducts = Array.isArray(products)
    ? products.filter((p) => p?.sellerId && String(p.sellerId) === String(sellerId))
    : [];

  const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  // ── Multi-image selection ──────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);
    setImages((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    // reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Add product ────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!title.trim() || !price || images.length === 0) {
      showToast("Title, price and at least one image are required", "error");
      return;
    }
    const num = Number(price);
    if (isNaN(num) || num <= 0) {
      showToast("Enter a valid price greater than 0", "error");
      return;
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("price", num);
    images.forEach((img) => fd.append("images", img)); // backend expects field "images"

    try {
      setLoading(true);
      const res = await api.post("/api/seller/product", fd);
      if (res?.data?._id) setProducts((prev) => [res.data, ...prev]);
      setTitle("");
      setPrice("");
      previews.forEach((url) => URL.revokeObjectURL(url));
      setImages([]);
      setPreviews([]);
      showToast("Listing added");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to add product", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete product ─────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await api.delete(`/api/seller/product/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      showToast("Listing deleted");
    } catch {
      showToast("Failed to delete listing", "error");
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#F7F5F2]">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F7F5F2]/90 backdrop-blur-sm border-b border-black/6 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-black/30">Seller Dashboard</p>
            <p className="text-[14px] font-bold text-black mt-0.5">{user.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5 space-y-4 pb-20">
        {/* Toast */}
        {toast && (
          <div className={`px-4 py-3 rounded-xl text-[12px] font-medium border ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-700"
              : "bg-red-50 border-red-100 text-red-600"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Listings", value: myProducts.length },
            { label: "Orders",   value: orders.length },
            { label: "Revenue",  value: `₹${totalRevenue}` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <p className="text-xl font-bold text-black leading-tight">{s.value}</p>
              <p className="text-[10px] text-black/30 mt-1 uppercase tracking-widest font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Add listing form */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="px-4 py-3 border-b border-black/4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-black/30">New Listing</p>
          </div>
          <div className="p-4 space-y-3">
            <input
              type="text"
              placeholder="Product title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 text-[13px] border border-black/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-black/20 placeholder-black/25 bg-black/2"
            />
            <input
              type="number"
              placeholder="Price (₹)"
              value={price}
              min="1"
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2.5 text-[13px] border border-black/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-black/20 placeholder-black/25 bg-black/2"
            />

            {/* Multi-image upload */}
            <div className="space-y-2">
              {/* Preview strip */}
              {previews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {previews.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="" className="w-16 h-16 object-cover rounded-xl border border-black/8" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {previews.length < MAX_IMAGES && (
                    <label
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-black/15 flex items-center justify-center cursor-pointer hover:border-black/30 hover:bg-black/2 transition-colors"
                    >
                      <svg className="w-5 h-5 text-black/25" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                    </label>
                  )}
                </div>
              )}

              {/* Initial upload button */}
              {previews.length === 0 && (
                <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-dashed border-black/12 cursor-pointer hover:border-black/25 hover:bg-black/2 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-black/30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0121 4.5v15A1.5 1.5 0 0119.5 21H4.5A1.5 1.5 0 013 19.5v-15A1.5 1.5 0 014.5 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-black/60">Add photos (up to {MAX_IMAGES})</p>
                    <p className="text-[10px] text-black/25 mt-0.5">JPG, PNG — max 5 MB each</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                </label>
              )}

              {previews.length > 0 && (
                <p className="text-[10px] text-black/25">{previews.length}/{MAX_IMAGES} photos added</p>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={loading}
              className="w-full py-2.5 bg-black text-white text-[13px] font-semibold rounded-xl disabled:opacity-40 hover:bg-black/80 transition-colors"
            >
              {loading ? "Adding…" : "Add Listing"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div className="flex border-b border-black/5">
            {[
              { id: "products", label: `Listings (${myProducts.length})` },
              { id: "orders",   label: `Orders (${orders.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-3 text-[12px] font-semibold transition-colors ${
                  activeTab === t.id
                    ? "text-black border-b-2 border-black"
                    : "text-black/30 hover:text-black/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Listings tab */}
          {activeTab === "products" && (
            myProducts.length === 0
              ? <p className="py-12 text-center text-[12px] text-black/25">No listings yet</p>
              : (
                <div className="divide-y divide-black/4">
                  {myProducts.map((product) => {
                    const thumb = Array.isArray(product.images) && product.images.length > 0
                      ? product.images[0]
                      : product.image;

                    return (
                      <div key={product._id} className="flex items-center gap-3 p-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/4 shrink-0">
                          {thumb
                            ? <img src={thumb} alt={product.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-black/15" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159" />
                                </svg>
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-black truncate">{product.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[12px] text-black/40">₹{product.price}</p>
                            {Array.isArray(product.images) && product.images.length > 1 && (
                              <span className="text-[10px] text-black/25">{product.images.length} photos</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-[11px] text-black/30 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
          )}

          {/* Orders tab */}
          {activeTab === "orders" && (
            ordersLoading
              ? <p className="py-12 text-center text-[12px] text-black/25">Loading…</p>
              : orders.length === 0
                ? <p className="py-12 text-center text-[12px] text-black/25">No orders yet</p>
                : (
                  <div className="divide-y divide-black/4">
                    {orders.map((order) => {
                      const mine = (order.items || []).filter(
                        (i) => String(i.sellerId) === String(sellerId),
                      );
                      if (!mine.length) return null;

                      const buyerName = order.buyerName || order.user?.name || "Student";
                      const buyerId  = order.user?._id || order.user;

                      return (
                        <div key={order._id} className="p-4 space-y-3">
                          {/* Order header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[11px] font-mono text-black/30">
                                  #{order._id?.slice(-8).toUpperCase()}
                                </p>
                                <StatusBadge status={order.status} />
                              </div>
                              {/* Buyer name */}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="w-5 h-5 rounded-full bg-black/8 flex items-center justify-center shrink-0">
                                  <svg className="w-3 h-3 text-black/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                  </svg>
                                </div>
                                <p className="text-[12px] font-semibold text-black">{buyerName}</p>
                                <span className="text-[10px] text-black/25">
                                  {order.createdAt
                                    ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                                    : ""}
                                </span>
                              </div>
                            </div>

                            {/* Chat button */}
                            {buyerId && (
                              <button
                                onClick={() => navigate(`/Chat/${buyerId}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[11px] font-semibold rounded-xl hover:bg-black/80 transition-colors shrink-0"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                </svg>
                                Chat
                              </button>
                            )}
                          </div>

                          {/* Line items */}
                          <div className="bg-black/2 rounded-xl p-3 space-y-1.5">
                            {mine.map((item, i) => (
                              <div key={i} className="flex items-center justify-between gap-2">
                                <span className="text-[12px] text-black/70 truncate flex-1">
                                  {item.title}
                                  <span className="text-black/30 ml-1">×{item.quantity}</span>
                                </span>
                                <span className="text-[12px] font-semibold text-black shrink-0">
                                  ₹{Number(item.price) * item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-black/30">Order total</span>
                            <span className="text-[13px] font-bold text-black">₹{order.totalAmount}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
          )}
        </div>
      </div>
    </div>
  );
}