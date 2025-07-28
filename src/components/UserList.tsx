import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BsChatTextFill } from "react-icons/bs";
import { FaUser } from "react-icons/fa";
import { io, Socket } from "socket.io-client";
import { MdOutlinePersonSearch } from "react-icons/md";
import { debounce } from "lodash";
import { MdCancel } from "react-icons/md";
// import { TiDelete } from "react-icons/ti";
// import { MdLocationSearching } from "react-icons/md";
// import ChatRoom from "../components/ChatRoom";
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
  const [userSearch, setUserSearch] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const getUsers = async () => {
      if (isSearching) {
        console.log("user search is going on");
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("authToken");

        if (!token) {
          console.log("no token found");
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
        if(userSearch.trim() === '') {
          setUserList(usersWithTimestamps);
        }
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
  }, [navigate, isSearching]);

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
    setLoading(false);
    console.log(`[UserList] Navigating to chat with user ID: ${UserId}`);
    navigate(`/dashboard/${UserId}`); 
  };

  const sortedUsers = [...userList].sort(
    (a, b) =>
      (b.lastMessageTimeStamp?.getTime() || 0) -
      (a.lastMessageTimeStamp?.getTime() || 0)
  );

  // useeffect function to search for users
  useEffect(() => {
    const debounncedSearchUser = debounce(async () => {
      if (!userSearch.trim()) {
        setIsSearching(false);
        setUserList([]);
        setUserCount(0);
        return;
      }
      try {
        setIsSearching(true);
        // setLoading(true)
        setError(null);
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.log("No auth token found, redirecting to login");
          navigate("/");
          return;
        }
        const url = import.meta.env.VITE_API_URL;
        if (!url) {
          console.error("[searchUser] VITE_API_URL is not defined!");
          setError("Backend API URL is not configured.");
          return;
        }

        const searchResponse = await axios.get<{
          success: boolean;
          data: Users[];
          count: number;
        }>(`${url}/api/v1/users/search?q=${userSearch}`, {
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = searchResponse;
        if (!searchResponse.data.success) {
          throw new Error("failed to find user");
        }
        console.log("search result:", data);
        const usersWithTimestamps = searchResponse.data.data.map(
          (user: Users) => ({
            ...user,
            lastMessageTimeStamp: user.lastMessageTimeStamp
              ? new Date(user.lastMessageTimeStamp)
              : null,
            lastMessageContent: user.lastMessageContent || "",
            lastMessageReadBy: user.lastMessageReadBy || [],
          })
        );

        console.log("[UserList] Search results:", usersWithTimestamps);
        setUserList(usersWithTimestamps);
        setUserCount(searchResponse.data.count);
      } catch (error: any) {
        setUserCount(0)
        console.error("error fetching user or user does not exist");
        setError(error.response?.data?.msg || "Failed to find user");
      } finally {
        setLoading(false);
      }
    }, 500);
    debounncedSearchUser();
    return () => debounncedSearchUser.cancel();
  }, [userSearch, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClearSearch = () => {
    setUserSearch("");
    setIsSearching(false);
    setError(null);
    // setUserList([]);
    setUserCount(0);
  };

  return (
    <div className="bg-[#1B1C1D] flex flex-col h-screen pb-2">
      <div className=" px-4 py-3">
        <div className="flex justify-between">
          <p className="text-white capitalize text-[20px] font-bold">chats</p>
          <div className="relative w-[20%] mr-0">
            <BsChatTextFill className="text-[45px] pl-5" />
            <p className="text-blue-800 text-[14px] absolute top-[-4px] left-[35px] border bg-white rounded-full flex items-center h-5 w-5">
              {userCount}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col border px-5 w-[95%] mx-2 justify-between  bg-white rounded-[5px]">
        <form onSubmit={handleSearch} className="flex items-center">
          <MdOutlinePersonSearch className="text-[35px] pl-3" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className=" w-full py-1 placeholder:px-3 border-none outline-none rounded-[5px]"
            placeholder="search or start a new conver..."
          />
          <MdCancel onClick={handleClearSearch} className="mr-4 text-[20px]" />
        </form>
        <div className="border-2 border-black w-full"></div>
      </div>
      {loading && (
        <div className="flex justify-center items-center flex-1">
          <p className="text-white text-[20px]">Loading users....</p>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center mt-20">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      {!loading && !error && userList.length === 0 && (
        <p className="text-red-800 text-center">
          No other users found. Please register more users.
        </p>
      )}

      {!loading && !error && userList.length > 0 && (
        <>
          <ul className="space-y-2 flex-1 overflow-y-auto scrollbar-hide px-2 mt-5">
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
                    <FaUser className="border rounded-full bg-blue-800 text-[#8d8d89] border-gray-600 w-9 h-9 p-1.5" />
                    <div className="flex flex-col space-y-1 pt- borde-red-900 borde-2 w-[100%] ">
                      <div className="flex justify-between">
                        <p className="text-white">{username}</p>
                        {lastMessageTimeStamp && (
                          <div className="mr-2">
                            <p className="text-blue-800 text-[12px]">
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
                      <p className="text-gray-400">
                        {lastMessageContent || "start conversation..."}
                      </p>
                      <div className="border-red-900">
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


