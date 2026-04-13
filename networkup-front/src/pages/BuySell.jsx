import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function BuySell() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null); // brief "Added ✓" feedback

  const { addToCart, cart = [] } = useOutletContext() || {};
  const navigate = useNavigate();

  // Sum quantities so "3 items" shows instead of just count of distinct entries
  const cartCount = cart.reduce((s, i) => s + (i.quantity || 1), 0);

  useEffect(() => {
    api
      .get("/api/seller/products")
      .then((res) => {
        if (Array.isArray(res.data)) setProducts(res.data);
        else if (Array.isArray(res.data?.products))
          setProducts(res.data.products);
        else setProducts([]);
      })
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = (item) => {
    addToCart(item);
    setAddedId(item._id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky header ── */}
      <div className="sticky top-1 z-20 bg-gray-100 rounded-3xl m-1 px-4 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">
            Campus Shop
          </h1>
          {!loading && (
            <p className="text-[11px] text-gray-600">
              {products.length} listing{products.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <button
          onClick={() => navigate("/cart")}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.874-7.148a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-20">
        {/* ── Skeleton ── */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse"
              >
                <div className="h-44 bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-8 bg-gray-100 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && products.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-3xl mb-3">🛍️</p>
            <p className="text-sm font-medium text-gray-600">No listings yet</p>
            <p className="text-xs text-gray-400 mt-1">Check back soon</p>
          </div>
        )}

        {/* ── Grid ── */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((item) => {
              const inCart = cart.some(
                (c) => (c._id || c.id) === (item._id || item.id),
              );
              const justAdded = addedId === (item._id || item.id);

              return (
                <article
                  key={item._id || item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-gray-50 overflow-hidden">
                    <img
                      src={item.image || "/images/no-image.png"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Price pill — white frosted chip, not blue blob */}
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm border border-gray-100 text-gray-900 text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                      ₹{item.price}
                    </div>
                  </div>

                  {/* Info + actions */}
                  <div className="p-3">
                    <h2 className="text-sm font-semibold text-gray-800 truncate mb-3 leading-tight">
                      {item.title}
                    </h2>
                    <div className="flex gap-2">
                      {/* Add / In Cart / Added feedback */}
                      <button
                        onClick={() => handleAdd(item)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          justAdded
                            ? "bg-green-600 text-white scale-95"
                            : inCart
                              ? "bg-blue-50 text-blue-600 border border-blue-200"
                              : "bg-gray-900 text-white hover:bg-gray-700"
                        }`}
                      >
                        {justAdded ? "Added ✓" : inCart ? "In Cart" : "Add"}
                      </button>
                      {/* Buy now — add then go to cart */}
                      <button
                        onClick={() => {
                          addToCart(item);
                          navigate("/cart");
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
