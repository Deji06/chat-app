import React, {useState} from "react";
// import router from 'react-router-dom'
import SignUp from "./components/SignUp";
import UserList from "./components/UserList.tsx";
import { Route, Routes } from "react-router-dom";
import LogIn from "./pages/LogIn.tsx";
import ChatRoom from './components/ChatRoom.tsx'
// import ChatRoom from "./pages/ChatRoom.tsx";
// import { Routes, Route } from 'react-router-dom'

function App() {
  const [registeredUser, setRegisteredUser]= useState<string | null>(null)
  return (
    <>
      <Routes>
        <Route path='/' element={<SignUp setRegisteredUser = {setRegisteredUser} />} />
        <Route path="/login" element={<LogIn  registeredUser={registeredUser}   />} />
        <Route path="/userList" element={<UserList />} />
        <Route  path="/chatRoom/:otherUserId" element={<ChatRoom />} />
      </Routes>
      {/* <SignUp /> */}
    </>
  );
}

export default App;
