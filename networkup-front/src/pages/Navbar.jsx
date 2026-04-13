import React from 'react'
import NotificationBell from "../components/NotificationBell.jsx";
import { useAuth } from "../context/AuthContext";
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  const { hasUnreadMessages, user } = useAuth();

  return (
    <nav className="border-gray-100 border-b-1" aria-label="Main navigation">
      <div className="flex justify-between p-2 items-center text-black">
        <div className="logo font-bold text-3xl">NetworkUp</div>

        <ul className="flex text-xl gap-3 items-center">
          {user ? (
            <>
              <NotificationBell />

              {/* Chat icon — visible on mobile, hidden on desktop */}
              <NavLink to="/messages" className="sm:hidden">
                <img src="/images/chat.svg" alt="Chat" className="w-6 h-6" />
              </NavLink>

          
              <NavLink to="/profile" className="hidden sm:block">
                <img
                  src={user?.profileImage || "/images/profile.svg"}
                  alt="Profile"
                  className="rounded-full border-2 border-blue-600 w-9 h-9 object-cover"
                />
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" className="p-1 focus:bg-blue-200 font-semibold border-1 bg-gray-200 text-sm rounded-2xl hover:bg-gray-300">
                Login
              </NavLink>
              <NavLink to="/signup" className="p-1 focus:bg-blue-200 font-semibold bg-gray-200 text-sm rounded-2xl hover:bg-gray-300">
                Sign Up
              </NavLink>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}