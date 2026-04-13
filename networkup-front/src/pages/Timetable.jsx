import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Timetable() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("");

  useEffect(() => {
    // Set today as active day
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    setActiveDay(DAYS.includes(today) ? today : "Monday");
  }, []);

  useEffect(() => {
    if (!user) return;

    if (!user.branch || !user.year || !user.section) {
      setLoading(false);
      return;
    }

    const fetchTimetable = async () => {
      try {
        const res = await api.get("/api/timetable/my");
        setTimetable(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [user]);

  const todaySchedule = timetable.find((t) => t.day === activeDay);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading timetable...</p>
      </div>
    );
  }

  // If user hasn't set branch/year/section yet
  if (!user?.branch || !user?.year || !user?.section) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
          <p className="text-4xl mb-4">📚</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Setup Your Profile First</h2>
          <p className="text-gray-600 mb-6">
            Please add your Branch, Year and Section in your profile to see your timetable.
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium"
          >
            Go to Profile →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">My Timetable</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.branch} • Year {user.year} • Section {user.section}
          </p>
        </div>
        <button onClick={() => navigate("/")} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm">
          ← Back
        </button>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
              activeDay === day
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Schedule */}
      <div className="space-y-3">
        {!todaySchedule || todaySchedule.slots.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-gray-500 font-medium">No classes on {activeDay}</p>
          </div>
        ) : (
          todaySchedule.slots.map((slot, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center gap-4"
            >
              {/* Time */}
              <div className="bg-blue-50 text-blue-600 font-semibold text-sm px-3 py-2 rounded-xl flex-shrink-0 text-center min-w-[80px]">
                {slot.time}
              </div>

              {/* Details */}
              <div className="flex-1">
                <p className="font-semibold text-black">{slot.subject}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  {slot.teacher && <span>👨‍🏫 {slot.teacher}</span>}
                  {slot.room && <span>📍 {slot.room}</span>}
                </div>
              </div>

              {/* Period number */}
              <div className="text-gray-300 text-sm font-medium">
                P{i + 1}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}