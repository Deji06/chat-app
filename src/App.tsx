import React, { useState } from "react";
// import router from 'react-router-dom'
import SignUp from "./components/SignUp";
// import UserList from "./components/UserList.tsx";
import { Route, Routes, Navigate, BrowserRouter } from "react-router-dom";
import LogIn from "./pages/LogIn.tsx";
// import ChatRoom from './components/ChatRoom.tsx'
import DashboardLayout from "./components/DashboardLayout.tsx";
// import ChatRoom from "./pages/ChatRoom.tsx";
// import { Routes, Route } from 'react-router-dom'

function App() {
  const isAuthenticated = !!localStorage.getItem("authToken");

  const [registeredUser, setRegisteredUser] = useState<string | null>(null);
  return (
    <>
        <Routes>
          <Route
            path="/"
            element={<SignUp setRegisteredUser={setRegisteredUser} />}
          />
          <Route
            path="/login"
            element={<LogIn registeredUser={registeredUser} />}
          />
          {/* <Route path="/userList" element={<UserList />} />  */}
          {/* <Route  path="/chatRoom" element={<ChatRoom  />}  /> */}
          <Route
            path="/dashboard/:otherUserId?"
            element={
              isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />
            }
          /> 
           <Route
            path="/chatRoom/:otherUserId"
            element={<Navigate to="/dashboard/:otherUserId" replace />}
          /> 
          <Route
            path="/chatRoom"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route path="*" element={<Navigate to="/Login" />} /> 
        </Routes>
    
    </>
  );
}

export default App;
      {/* <SignUp /> */}

{
  /* Dashboard Layout for authenticated users
          - /dashboard: Will show just the UserList on desktop, or be the default for mobile when no chat is selected.
          - /dashboard/:otherUserId: Will show both UserList and ChatRoom on desktop, or just ChatRoom on mobile.
          
          Using Navigate to redirect unauthenticated users
        */
}
// <Route
//   path="/dashboard/:otherUserId?" // The '?' makes :otherUserId optional
//   element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}
// />

{
  /* Add a redirect for the old /chatRoom path if it's still linked somewhere */
}
// <Route path="/chatRoom/:otherUserId" element={<Navigate to="/dashboard/:otherUserId" replace />} />
// <Route path="/chatRoom" element={<Navigate to="/dashboard" replace />} />

{
  /* Catch-all for unknown paths, redirect to login or signup */
}
//   <Route path="*" element={<Navigate to="/login" />} />
// </Routes>
