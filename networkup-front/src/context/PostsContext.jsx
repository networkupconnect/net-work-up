import { createContext, useContext, useState, useCallback, useRef } from "react";
import api from "../api/axios";

const PostsContext = createContext();

export const PostsProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastFetchedRef = useRef(null);

  const fetchPosts = useCallback(async (force = false) => {
    const now = Date.now();
    // 60 sec se kam time hua hai aur force nahi → skip
    if (!force && lastFetchedRef.current && now - lastFetchedRef.current < 60000) return;

    try {
      setLoading(true);
      const res = await api.get("/api/feed/posts");
      setPosts(Array.isArray(res.data) ? res.data : []);
      lastFetchedRef.current = now;
    } catch (err) {
      console.error("❌ Error fetching posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PostsContext.Provider value={{ posts, setPosts, loading, fetchPosts }}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => useContext(PostsContext);