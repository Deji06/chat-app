import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { IoMdSend } from "react-icons/io";

interface User {
  _id: string;
  email: string;
}

interface Message {
  _id: string;
  reciever: { _id: string; name: string; email: string };
  sender: { _id: string; name: string; email: string };
  content: string;
  createdAt: string;
}

let socket: any;

const chatCompoent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const currentUserIdRef = useRef<string | null>(null)

  //   getting current user id from jwt sign
  const getCurrentUserIdFromToken = () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decodedToken: any = JSON.parse(atob(token.split(".")[1]));
        return decodedToken.userId;
      } catch (error) {
        console.error("error fetching id", error);
        setError('something went wrong, try later!')
        return null;
      }
    }
  };

  useEffect(()=> {
    currentUserIdRef.current = getCurrentUserIdFromToken()
    if(!currentUserIdRef.current) {
      navigate('/')
    }

  },[])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const token = localStorage.getItem("authToken");
    const currentUserId = currentUserIdRef.current;
    // const getOtherUserId =
    if (!token || !otherUserId || !currentUserId) {
      navigate("/login");
      return;
    }
    try {
      setError(null)
      const url = import.meta.env.VITE_API_URL;
        if (!url) {
        console.error("VITE_API_URL is not defined! Check .env file.");
        setError("Backend API URL is not configured.");
        return;
      }
      const config = {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };
      const payload = {
        senderId: currentUserId,
        receiverId: otherUserId,
        content:newMessage
      }

      // const payload = JSON.stringify(body)
      const response = await axios.post(`${url}/api/v1/messages`, payload, config)
      const data = response.data
      setNewMessage(data)


    } catch (error) {
      console.error('error fecthing messages', error)
    }
  };

  return (
    <>
      <div className="bg-[url('whatsapp.jpg')] h-screen overflow-hidden  pt-2 px-3  relative">
        <h1 className="text-white">chat room</h1>
        
        <form
          action=""
          onSubmit={handleSendMessage}
          className="absolute bottom-1 left-0 px-2 flex  w-screen"
        >
          <div className="flex justify-between  w-[75%] ">
            <input
              type="text"
              placeholder="Type a message.."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 py-2 px-4 rounded-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
              // className="py-2 w-[530%] "
            />

            <button
              type="submit"
              className=" hover:bg-[#303030] text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
              <IoMdSend className="text-[30px]" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default chatCompoent;
