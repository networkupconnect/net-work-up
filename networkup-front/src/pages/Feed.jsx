import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

export default function Feed() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [posting, setPosting]   = useState(false);
  const [text, setText]         = useState("");
  const [image, setImage]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [toast, setToast]       = useState(null);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/posts");
      setPosts(res.data);
    } catch { showToast("Failed to load posts", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return showToast("Write something first", "error");

    // ✅ Optimistic update — show post instantly
    const tempPost = {
      _id: `temp_${Date.now()}`,
      content: text,
      image: preview,
      author: { _id: user._id, name: user.name, profileImage: user.profileImage },
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      _isTemp: true,
    };
    setPosts(p => [tempPost, ...p]);
    const savedText = text;
    const savedImage = image;
    setText(""); setImage(null); setPreview(null);

    try {
      setPosting(true);
      const fd = new FormData();
      fd.append("content", savedText);
      if (savedImage) fd.append("image", savedImage);
      const res = await api.post("/api/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Replace temp post with real one from server
      setPosts(p => p.map(post => post._id === tempPost._id ? res.data : post));
      showToast("Posted!");
    } catch (err) {
      // Remove temp post on failure
      setPosts(p => p.filter(post => post._id !== tempPost._id));
      setText(savedText); setImage(savedImage);
      showToast(err.response?.data?.message || "Failed", "error");
    } finally { setPosting(false); }
  };

  const handleLike = async (id) => {
    if (!user) return navigate("/login");

    // ✅ Optimistic update — toggle like instantly
    const isLiked = posts.find(p => p._id === id)?.likes?.includes(user._id);
    setPosts(p => p.map(post =>
      post._id === id
        ? {
            ...post,
            likes: isLiked
              ? post.likes.filter(lid => lid !== user._id)
              : [...(post.likes || []), user._id],
          }
        : post
    ));

    try {
      const res = await api.patch(`/api/posts/${id}/like`);
      // Sync with server response
      setPosts(p => p.map(post => post._id === id ? { ...post, likes: res.data.likes } : post));
    } catch {
      // Revert on error
      setPosts(p => p.map(post =>
        post._id === id
          ? {
              ...post,
              likes: isLiked
                ? [...(post.likes || []), user._id]
                : post.likes.filter(lid => lid !== user._id),
            }
          : post
      ));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;

    // ✅ Optimistic update — remove instantly
    const deletedPost = posts.find(p => p._id === id);
    setPosts(p => p.filter(post => post._id !== id));

    try {
      await api.delete(`/api/posts/${id}`);
      showToast("Deleted!");
    } catch {
      // Revert on error
      setPosts(p => [deletedPost, ...p]);
      showToast("Failed", "error");
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="w-full">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-xl ${
          toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
        }`}>{toast.msg}</div>
      )}

      <div className="max-w-2xl mx-auto px-2 py-4">

        {/* Post composer */}
        {user ? (
          <form onSubmit={handlePost} className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 shadow-sm">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm flex-shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea
                  placeholder={`What's on your mind, ${user.name?.split(" ")[0]}?`}
                  rows={3} value={text}
                  onChange={e => setText(e.target.value)}
                  className="w-full border-0 outline-none resize-none text-gray-800 text-sm placeholder-gray-400 bg-transparent"
                />
                {preview && (
                  <div className="relative mt-2">
                    <img src={preview} alt="" className="w-full max-h-48 object-cover rounded-xl" />
                    <button type="button" onClick={() => { setImage(null); setPreview(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center">
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <label className="cursor-pointer text-gray-400 hover:text-blue-500 transition-colors text-sm flex items-center gap-1">
                    <span>📷</span>
                    <span>Photo</span>
                    <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                  </label>
                  <button type="submit" disabled={posting || !text.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-5 py-1.5 rounded-full text-sm font-bold transition-all">
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 text-center shadow-sm">
            <p className="text-gray-500 text-sm mb-3">Login to post and interact with your campus</p>
            <button onClick={() => navigate("/login")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-bold transition-all">
              Login →
            </button>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
            <p className="text-4xl mb-3">📢</p>
            <p className="text-gray-700 font-bold">No posts yet</p>
            <p className="text-gray-400 text-sm mt-1">Be the first to post something!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const isOwner = post.author?._id === user?._id;
              const isLiked = post.likes?.includes(user?._id);
              return (
                <div key={post._id} className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-opacity ${post._isTemp ? "opacity-70" : "opacity-100"}`}>

                  {/* Header */}
                  <div className="flex items-center gap-3 p-4 pb-3">
                    <div onClick={() => !post._isTemp && navigate(`/user/${post.author?._id}`)}
                      className="cursor-pointer flex-shrink-0">
                      {post.author?.profileImage ? (
                        <img src={post.author.profileImage} alt=""
                          className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">
                          {post.author?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p onClick={() => !post._isTemp && navigate(`/user/${post.author?._id}`)}
                        className="text-gray-900 font-semibold text-sm cursor-pointer hover:underline">
                        {post.author?.name}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {post._isTemp ? "Posting..." : timeAgo(post.createdAt)}
                      </p>
                    </div>
                    {!post._isTemp && (isOwner || user?.role === "admin") && (
                      <button onClick={() => handleDelete(post._id)}
                        className="text-gray-300 hover:text-red-400 text-sm transition-all">
                        🗑
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-3">
                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* Image */}
                  {post.image && (
                    <img src={post.image} alt="" className="w-full object-cover max-h-96" />
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100">
                    
                    <button
                      onClick={() => !post._isTemp && handleLike(post._id)}
                      disabled={!!post._isTemp}
                      className={`flex items-center gap-1.5 text-sm transition-all ${
                        isLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
                      }`}>
                      <span>{isLiked ? "❤️" : "🤍"}</span>
                      <span className="font-semibold">{post.likes?.length || 0}</span>
                    </button>
                    <button
                      onClick={() => !post._isTemp && navigate(`/user/${post.author?._id}`)}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500 transition-all">
                      <span>💬</span>
                      <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}