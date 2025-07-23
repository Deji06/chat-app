import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// import ChatRoom from "../components/ChatRoom";
import { BsChatTextFill } from "react-icons/bs";
import { FaUser } from "react-icons/fa";
import { io, Socket } from "socket.io-client";
// import { FaRocketchat } from "react-icons/fa";

interface Users {
  _id: string;
  email: string;
  username: string;
  lastMessageTimeStamp?: Date | null;
  lastMessageContent?: string;
  lastMessageReadBy?: string[];
  // count:numb
}

interface Message {
  _id: string;
  reciever: { _id: string; name?: string; email: string; username?: string };
  sender: { _id: string; name?: string; email: string; username: string };
  content: string;
  createdAt: string | Date;
  readBy: string[];
}

const UserList = () => {
  const navigate = useNavigate();
  const [userList, setUserList] = useState<Users[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  // const[userName, setUserName] = useState([])

  useEffect(() => {
    const getUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("authToken");

        if (!token) {
          console.log("no toekn found");
          navigate("/");
          return;
        }

        const url = import.meta.env.VITE_API_URL;
        if (!url) {
          console.error("[UserList ERROR] VITE_API_URL is not defined!");
          setError("Backend API URL is not configured.");
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const fetchUsers = await axios.get(`${url}/api/v1/users`, config);
        const usersWithTimestamps = fetchUsers.data.data.map((user: Users) => ({
          ...user,
          lastMessageTimeStamp: user.lastMessageTimeStamp
            ? new Date(user.lastMessageTimeStamp)
            : null, // Use actual timestamp from backend
          lastMessageContent: user.lastMessageContent || "", // Add message content
        }));
        console.log("fetchedusers:", usersWithTimestamps);

        setUserList(usersWithTimestamps || []);
        setUserCount(fetchUsers.data.count);
      } catch (error: any) {
        console.error("[UserList] Error fetching users:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        // Handle token expiration
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/");
        }
        setError(error.response?.data?.msg || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, [navigate]);

  // Socket.IO setup for real-time updates
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("[UserList Socket] No token, skipping connection");
      navigate("/");
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.error("[UserList Socket] VITE_API_URL is not defined!");
      setError("Backend API URL not configured.");
      return;
    }

    socketRef.current = io(apiUrl, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      timeout: 20000,
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      console.log("[UserList Socket] Connected:", socketRef.current?.id);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("[UserList Socket] Connection error:", err.message);
      if (err.message === "Authentication error") {
        localStorage.removeItem("authToken");
        navigate("/");
      }
      setError(`Socket connection failed: ${err.message}`);
    });

    socketRef.current.on("messageError", ({ event, error }) => {
      console.error(`[UserList Socket] Error in ${event}: ${error}`);
      setError(error);
    });

    // Update user's last message timestamp when new message arrives
    const handleNewMessage = (data: unknown) => {
      const isMessage = (obj: any): obj is Message => {
        return (
          obj && obj.sender && obj.reciever && obj.createdAt && obj.content
        );
      };

      if (!isMessage(data)) {
        console.error("Invalid message format:", data);
        return;
      }

      const message = data as Message;
      setUserList((prevUsers) =>
        prevUsers.map((user) =>
          user._id === message.sender._id || user._id === message.reciever._id
            ? {
                ...user,
                lastMessageTimeStamp: new Date(message.createdAt),
                lastMessageContent:
                  message.content.length > 30
                    ? message.content.substring(0, 30) + "..."
                    : message.content,
                lastMessageReadBy: message.readBy || [],
              }
            : user
        )
      );
    };
    socketRef.current.on("messageRead", (message: Message) => {
      setUserList((prevUsers) =>
        prevUsers.map((user) =>
          user._id === message.sender._id || user._id === message.reciever._id
            ? { ...user, lastMessageReadBy: message.readBy || [] }
            : user
        )
      );
    });

    socketRef.current.on("newMessage", handleNewMessage);

    return () => {
      socketRef.current?.off("newMessage", handleNewMessage);
      socketRef.current?.off("messageRead");
      socketRef.current?.off("connect");
      socketRef.current?.off("connect_error");
      socketRef.current?.off("messageError");
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [navigate]);

  // Function to handle clicking on a user to start a chat
  const handleUserClick = (UserId: string) => {
    console.log(`[UserList] Navigating to chat with user ID: ${UserId}`);
    navigate(`/dashboard/${UserId}`); // Navigate to the dashboard route with the user's ID
  };

  const sortedUsers = [...userList].sort(
    (a, b) =>
      (b.lastMessageTimeStamp?.getTime() || 0) -
      (a.lastMessageTimeStamp?.getTime() || 0)
  );

  return (
    <div className="bg-[#1B1C1D] flex flex-col h-screen">
      {loading && (
        <div className="flex justify-center items-center flex-1">
          <p className="text-white text-[20px]">Loading users....</p>
        </div>
      )}

      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && userList.length === 0 && (
        <p className="text-gray-400 text-center mt-4">
          No other users found. Please register more users.
        </p>
      )}

      {!loading && !error && userList.length > 0 && (
        <>
          <div className="flex justify-between items-center flex-shrink-0 mb-6 px-3 py-5">
            <p className="text-white capitalize text-[18px]">chats</p>

            <div className="relative w-[20%]">
              <BsChatTextFill className="text-[20px]" />
              <p className="text-black text-[14px] absolute top-[-10px] left-5 border bg-white rounded-full flex items-center h-5 w-5">
                {userCount}
              </p>
            </div>
          </div>
          {/* <input type="text" /> */}

          <ul className="space-y-5 flex-1 overflow-y-auto scrollbar-hide">
            {sortedUsers.map((user: Users) => {
              const {
                _id: id,
                username,
                // email,
                lastMessageTimeStamp,
                lastMessageContent,
                lastMessageReadBy,
              } = user;
              return (
                <li key={id}>
                  <button
                    className="w-full text-left p-2 rounded hover:bg-gray-600 transition-colors flex items-center gap-x-5"
                    onClick={() => handleUserClick(id)}
                  >
                    <FaUser className="border rounded-full bg-blue-500 text-[#CCCDDE] border-gray-600 w-9 h-9 p-1.5" />
                    <div className="flex flex-col pt- border-red-900 border-2 w-[100%] ">
                      <div className="flex justify-between">
                        <p className="text-white">{username}</p>
                        {lastMessageTimeStamp && (
                          <div className="`">
                            <p className="text-blue-500">
                              {/* Last active:{" "} */}
                              {lastMessageTimeStamp.toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  timeZone: "Africa/Lagos",
                                }
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-white">
                        {lastMessageContent || "no recent messages"}
                      </p>
                      <div>
                        {currentUserIdRef.current === user._id
                          ? lastMessageReadBy?.includes(user._id)
                            ? " ✓✓"
                            : " ✓"
                          : ""}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

export default UserList;
