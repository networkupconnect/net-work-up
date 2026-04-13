import { useOutletContext, useNavigate } from "react-router-dom";

export default function Cart() {
  const { cart, increaseQty, decreaseQty } = useOutletContext();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const total = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  return (
    <div
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      className="min-h-screen bg-[#F7F5F2]"
    >
      {/* Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F7F5F2]/90 backdrop-blur-sm border-b border-black/6 px-5 h-14 flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-[0.08em] uppercase text-black/40">
          Cart
        </span>
        {cart.length > 0 && (
          <span className="text-[12px] font-medium text-black/30">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center">
            <svg className="w-7 h-7 text-black/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.938-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <p className="text-[13px] text-black/40 font-medium">Your cart is empty</p>
          <button
            onClick={() => navigate("/buy-sell")}
            className="mt-1 text-[12px] font-semibold text-black underline underline-offset-2"
          >
            Browse listings
          </button>
        </div>
      ) : (
        <div className="max-w-lg mx-auto px-5 py-5">
          {/* Items */}
          <div className="space-y-2">
            {cart.map((item) => {
              const imgSrc = Array.isArray(item.images) && item.images.length > 0
                ? (item.images[0].startsWith("http") ? item.images[0] : `${API}${item.images[0]}`)
                : item.image
                  ? (item.image.startsWith("http") ? item.image : `${API}${item.image}`)
                  : null;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl p-3 flex items-center gap-3"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/5 shrink-0">
                    {imgSrc ? (
                      <img src={imgSrc} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-black/15" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-black truncate">{item.title}</p>
                    <p className="text-[12px] text-black/40 mt-0.5">₹{item.price} each</p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => decreaseQty(item._id)}
                      className="w-7 h-7 rounded-lg bg-black/6 flex items-center justify-center text-black font-bold text-[16px] hover:bg-black/10 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-[13px] font-semibold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => increaseQty(item._id)}
                      className="w-7 h-7 rounded-lg bg-black flex items-center justify-center text-white font-bold text-[16px] hover:bg-black/80 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Line total */}
                  <p className="text-[13px] font-bold text-black shrink-0 w-14 text-right">
                    ₹{Number(item.price) * item.quantity}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-5 bg-white rounded-2xl p-4 flex items-center justify-between" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div>
              <p className="text-[11px] text-black/30 uppercase tracking-widest font-semibold">Total</p>
              <p className="text-2xl font-bold text-black mt-0.5">₹{total}</p>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="px-6 py-3 bg-black text-white text-[13px] font-semibold rounded-xl hover:bg-black/80 transition-colors"
            >
              Checkout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}