import { useState } from "react";
import SignUp from "./components/SignUp";
import { Route, Routes, Navigate } from "react-router-dom";
import LogIn from "./pages/LogIn.tsx";
import DashboardLayout from "./components/DashboardLayout.tsx";
// import router from 'react-router-dom'
// import UserList from "./components/UserList.tsx";
// import ChatRoom from './components/ChatRoom.tsx'
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
   
