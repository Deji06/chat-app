// import React from 'react'
import UserList from "../components/UserList";
import ChatRoom from "./ChatRoom";
import { useParams } from "react-router-dom";
import whatsapp from "../asset/whatsapp.jpg";

const DashboardLayout = () => {
  const { otherUserId } = useParams<{ otherUserId: string }>();
  return (
    <div className="flex justify-between">
      <div
        className={`md:w-[25%] ${
          otherUserId ? "hidden" : "block"
        } w-full md:block md:flex-shrink-0`}
      >
        <UserList />
      </div>
      <div className={`w-[75%]  flex-1 h-full`}>
        {otherUserId ? (
          <ChatRoom />
        ) : (
          <div
            className="h-screen hidden md:flex text-center p-4"
            style={{ background: `url(${whatsapp})` }}
          >
            <p className="mt-10 bg-gray-800 py-3 text-[20px] bg-opacity-40 text-white h-[50px] p-5 w-screen">
              select a chat from the left to start messaging!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;
