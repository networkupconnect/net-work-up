import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { socket } from "../socket";
import api from "../api/axios";

export default function Chat() {
  const { userId: receiverId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [receiver, setReceiver] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // Redirect if chatting with yourself
  useEffect(() => {
    if (user && receiverId === user._id) {
      navigate("/messages", { replace: true });
    }
  }, [user, receiverId, navigate]);

  // Socket setup
  useEffect(() => {
    if (!user) return;
    socket.connect();
    socket.emit("user_online", user._id);

    // Only add incoming messages from the other person (sender emits message_sent)
    socket.on("receive_message", (msg) => {
      if (msg.senderId === receiverId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("message_sent", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user_typing", ({ senderId }) => {
      if (senderId === receiverId) setIsTyping(true);
    });

    socket.on("user_stop_typing", ({ senderId }) => {
      if (senderId === receiverId) setIsTyping(false);
    });

    socket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_sent");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("online_users");
      socket.disconnect();
    };
  }, [user, receiverId]);

  // Load messages + receiver info
  useEffect(() => {
    if (!receiverId) return;
    const load = async () => {
      try {
        const [msgsRes, usersRes] = await Promise.all([
          api.get(`/api/chat/messages/${receiverId}`),
          api.get("/api/chat/users"),
        ]);
        setMessages(Array.isArray(msgsRes.data) ? msgsRes.data : []);
        const found = usersRes.data.find((u) => u._id === receiverId);
        setReceiver(found || null);
      } catch (err) {
        console.error("Failed to load chat:", err);
      }
    };
    load();
  }, [receiverId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit("send_message", {
      senderId: user._id,
      receiverId,
      text: text.trim(),
    });
    setText("");
    clearTimeout(typingTimeout.current);
    socket.emit("stop_typing", { senderId: user._id, receiverId });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socket.emit("typing", { senderId: user._id, receiverId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop_typing", { senderId: user._id, receiverId });
    }, 1000);
  };

  const isOnline = onlineUsers.includes(receiverId);

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shadow-sm shrink-0">
        <button
          onClick={() => navigate("/messages")}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <img src="/images/back.svg" alt="Back" className="w-4 h-4" />
        </button>

        <div
          className="cursor-pointer"
          onClick={() => receiver && navigate(`/user/${receiverId}`)}
        >
          {receiver?.profileImage ? (
            <img
              src={receiver.profileImage}
              className="w-10 h-10 rounded-full object-cover"
              alt={receiver.name}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">
              {receiver?.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>

        <div
          className="flex-1 cursor-pointer"
          onClick={() => receiver && navigate(`/user/${receiverId}`)}
        >
          <p className="font-semibold text-sm text-gray-900">
            {receiver?.name || "Loading…"}
          </p>
          <p className={`text-xs ${isOnline ? "text-green-500" : "text-gray-400"}`}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-8">
            No messages yet. Say hi 👋
          </p>
        )}

        {messages.map((msg, i) => {
          const isMine =
            msg.senderId === user._id ||
            msg.senderId?._id === user._id ||
            msg.senderId?.toString() === user._id?.toString();

          return (
            <div
              key={msg._id || i}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm shadow-sm ${
                  isMine
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none border border-gray-100"
                }`}
              >
                <p>{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isMine ? "text-blue-100" : "text-gray-400"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl rounded-bl-none text-sm text-gray-400 shadow-sm">
              typing…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-white flex gap-2 shrink-0">
        <input
          value={text}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message…"
          className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm bg-gray-50 focus:bg-white transition-all"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim()}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-40 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}