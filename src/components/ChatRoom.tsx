import React, { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { IoMdSend } from "react-icons/io";
import whatsapp from "../asset/whatsapp.jpg";
import { FaUser } from "react-icons/fa";
import { IoArrowUndoSharp } from "react-icons/io5";

interface User {
  _id: string;
  email: string;
  username?: string;
  name?: string;
}

interface Message {
  _id: string;
  reciever: { _id: string; name?: string; email: string , username?: string};
  sender: { _id: string; name?: string; email: string , username:string};
  content: string;
  createdAt: string;
}

// let socket: any;

const ChatRoom = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { otherUserId } = useParams<{ otherUserId: string }>();
  const currentUserIdRef = useRef<string | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  //   getting current user id from jwt signf
  const getCurrentUserIdFromToken = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("no current user id is found in authToken");
      return null;
    }
    try {
      const decodedToken: any = JSON.parse(atob(token.split(".")[1]));
      console.log("current user id:", decodedToken.userId);

      return decodedToken.userId;
    } catch (error) {
      console.error("error fetching id", error);
      setError("something went wrong, try later!");
      return null;
    }
  };

  useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);

  useEffect(() => {
    currentUserIdRef.current = getCurrentUserIdFromToken();
    if (!currentUserIdRef.current) {
      console.log("current user id not found");
      navigate("/");
      return;
    }
    console.log("current userid:", currentUserIdRef.current);
  }, [navigate]);

  // Effect 2: Fetch details of the other user in the chat
  useEffect(() => {
    const fetchOtherUserDetails = async () => {
      const token = localStorage.getItem("authToken");
      const currentUserId = currentUserIdRef.current;
      if (!token || !otherUserId || !currentUserId) {
        console.log(
          `[EFFECT 2 SKIP] Skipping API call: token=${!!token}, otherUserId=${otherUserId}, currentUserId=${currentUserId}`
        );

        if (!currentUserId) {
          // This case should be caught by EFFECT 1, but keep for robustness
          console.log(
            "[EFFECT 2 REDUNDANT NAV] currentUserId missing, navigating to /login (Effect 2)."
          );
          // navigate("/login");
        }
        return;
      }
      console.log(
        `[EFFECT 2 API CALL] Token present, IDs present. Making GET /api/v1/users for otherUser: ${otherUserId}`
      );

      try {
        const url = import.meta.env.VITE_API_URL;
        if (!url) {
          console.error(
            "VITE_API_URL is not defined in environment variables!"
          );
          setError("Backend API URL is not configured correctly.");
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch all users and then find the specific one
        const response = await axios.get<{ data: User[] }>(
          `${url}/api/v1/users`,
          config
        );
        const foundOtherUser = response.data.data.find(
          (u: User) => u._id === otherUserId
        );

        console.log("other users id :", response.data);
        
        
        setOtherUser(foundOtherUser || null);
        console.log(
          `[EFFECT 2 SUCCESS] Fetched otherUser. Found: ${!!foundOtherUser}. Data:`,
          foundOtherUser
        );
        console.log("otheer user details:", foundOtherUser?.username);

        console.log(
          `[EFFECT 2 SUCCESS] Fetched otherUser. Found: ${!!foundOtherUser}. Data:`,
          foundOtherUser
        );

        if (!foundOtherUser) {
          setError("Chat partners not found.");
          if (otherUserId === currentUserId) {
            // currentUserId should be available from ref
            console.log(
              `[EFFECT 2 NO USER] Chat partner not found for ID: ${otherUserId}. (WARNING: This ID matches current user ID!)`
            );
            setError(
              "Cannot chat with yourself using this method, or user not found."
            );
          } else {
            console.log(
              `[EFFECT 2 NO USER] Chat partner not found for ID: ${otherUserId}. (User with this ID not in list)`
            );
          }
        }
      } catch (err: any) {
        console.error(
          "[EFFECT 2 ERROR] Failed to fetch other user details:",
          err
        );
        if (axios.isAxiosError(err) && err.response) {
          setError(
            err.response.data?.message || "Failed to load chat partner details."
          );
          if (err.response.status === 401) {
            console.log(
              "[EFFECT 2 NAV] 401 from other user fetch. Redirecting to /login."
            );
            navigate("/login");
            localStorage.removeItem("authToken");
            return;
          } else {
            console.log(
              `[EFFECT 2 ERROR] Server responded with status ${err.response.status}. Message: ${err.response.data?.message}`
            );
          }
        } else {
          setError("Network error or unexpected issue.");
          console.log(`[EFFECT 2 ERROR] Network error: ${err.message}`);
        }
      }
    };
    // This condition controls WHEN the async fetchOtherUserDetails runs
    if (otherUserId && currentUserIdRef.current) {
      fetchOtherUserDetails();
    } else {
      console.log(
        "[EFFECT 2 END] Conditions not met for fetchOtherUserDetails. Skipping."
      );
    }
  }, [otherUserId, navigate]);

  // Effect 3: Fetch initial chat history when component mounts or otherUserId changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      const token = localStorage.getItem("authToken");
      const currentUserId = currentUserIdRef.current; // Get ID from ref

      if (!token || !otherUserId || !currentUserId) {
        console.log(
          "Cannot fetch chat history: Missing token, otherUserId, or currentUserId."
        );
        if (!currentUserId) {
          // This case should be caught by EFFECT 1, but keep for robustness
          console.log(
            "[EFFECT 3 REDUNDANT NAV] currentUserId missing, navigating to /login (Effect 3)."
          );
          navigate("/login");
        }

        return;
      }
      console.log(
        `[EFFECT 3 API CALL] Token present, IDs present. Making GET /api/v1/messages/${otherUserId}`
      );

      setLoading(true); // Start loading before fetch
      setError(null); // Clear previous errors

      try {
        const url = import.meta.env.VITE_API_URL; // Correct env var name
        if (!url) {
          console.error(
            "VITE_API_URL is not defined in environment variables!"
          );
          setError("Backend API URL is not configured correctly.");
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.get<
          any,
          { data: { messages: Message[] } }
        >(`${url}/api/v1/messages/${otherUserId}`, config);
        setMessages(response.data.messages); // Update state with fetched messages
        console.log(
          `[EFFECT 3 SUCCESS] Fetched ${response.data.messages.length} historical messages. Data:`,
          response.data.messages
        );
      } catch (err: any) {
        console.error("Error fetching chat history:", err);
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data?.message || "Failed to fetch messages.");
        } else {
          setError("Network error or unexpected issue.");
        }
        if (err.response?.status === 401) {
          navigate("/login"); // Redirect if auth fails
        }
      } finally {
        setLoading(false); // End loading
      }
    };

    // Only call the fetch function if otherUserId is present and currentUserId is loaded
    if (otherUserId && currentUserIdRef.current) {
      fetchChatHistory();
    } else {
      console.log(
        "[EFFECT 3 END] Conditions not met for fetchChatHistory. Skipping."
      );
    }
  }, [otherUserId, navigate]); // Dependencies: otherUserId and navigate

  // Effect 4: Auto-scroll to the latest message whenever messages state changes
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const token = localStorage.getItem("authToken");
    const currentUserId = currentUserIdRef.current;
    // const getOtherUserId =
    if (
      !token ||
      !otherUserId ||
      !currentUserId ||
      !otherUser ||
      !otherUser._id
    ) {
      console.error(`[handleSendMessage SKIP] Cannot send message: Missing token, otherUserId, currentUserId, or otherUser details.
        Token: ${!!token}, otherUserId: ${otherUserId}, currentUserId: ${currentUserId}, otherUser: ${!!otherUser}, otherUser._id: ${
        otherUser?._id
      }`);
      // navigate("/login");
      if (!token || !currentUserId) {
        console.log("token not found");

        // navigate("/login");
      } else {
        setError(
          "Chat partner details not fully loaded. Please wait or select another user."
        );
      }
      return;
    }
    try {
      setError(null);
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
        reciever: otherUser._id,
        content: newMessage,
      };

      // const payload = JSON.stringify(body)
      const response = await axios.post(
        `${url}/api/v1/messages`,
        payload,
        config
      );
      const sentMessage = response.data.data;
      console.log("message:", sentMessage);
      // setNewMessage(sentMessage);
        console.log('Successfully sent message and updated messages state.');

      setMessages((prevMessages) => [...prevMessages, sentMessage]);
      // setNewMessage(response.data.data.content)
      setNewMessage("");
    } catch (error: any) {
      console.error("error sending messages", error);
      let errorMessage = "Failed to send message";
      if (axios.isAxiosError(error) && error.response) {
        // errorMessage = error.response.data?.message || errorMessage;
        if (error.response.status === 401) {
          console.log("authentication failed, redirecting to login");
          navigate("/login");
          localStorage.removeItem("authToken");
          return;
        } else {
          errorMessage =
            error.response.data?.message ||
            `Server error: ${error.response.status}`;
        }
      } else {
        // For network errors (no response from server) or other non-Axios errors
        errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);
    }
  };

  // if (error) {
  //   return <div className="text-center text-red-500 p-4">Error: {error}</div>;
  // }

  return (
    <>
      <div
        className="h-screen flex flex-col  relative"
        style={{ backgroundImage: `url(${whatsapp})`, backgroundSize:'cover', backgroundRepeat:'no-repeat', backgroundPosition:'center' }}
      >
        <div className="flex shrink-0 items-center gap-x-8 bg-[#1B1C1D] py-3 px-5">
          <IoArrowUndoSharp  className="text-white md:hidden " onClick={()=> navigate('/dashboard')}/>
            <div className="flex items-center gap-x-2">
              <FaUser className="border rounded-full bg-blue-500 text-[#CCCDDE] border-gray-600 w-9 h-9 p-1.5" />
              <h1 className="text-white">
                {otherUser ? otherUser?.username || otherUser.name : "chat room"}
              </h1>

            </div>
        </div>

        <div className="mt-1 flex-1 overflow-y-auto scrollbar-hide px-4 pb-20 space-y-1 ">
          {messages.length === 0 ? (
            otherUser?.username ? 
            <h1 className="text-white flex flex-1 items-center justify-center  text-[20px] w-[90%] bg-gray-800 bg-opacity-40 py-3">start converstion with {otherUser.username}!</h1> 
            : <h1 className="text-white flex flex-1 items-center justify-center  text-[20px] w-[90%] m-auto bg-gray-800 bg-opacity-40 py-3">start converstion!</h1>
          ): (
            messages.map((message)=> (
              <div key={message._id} className={` flex  px-2  ${message.sender._id === currentUserIdRef.current? 'justify-end': 'justify-start'}`}>
                <div className={`borde flex items-cente gap-x-2 max-w-[70%] px-5 py-1 rounded-xl ${message.sender._id === currentUserIdRef.current ? 'bg-blue-500 ': 'bg-[#1B1C1D]'} `}>
                   <p className="text-white ">{message.content}</p>
                   <p className="text-xs mt-3 opacity-75">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

            ))
          )
           }

        <div ref={messagesEndRef} /> 
        </div>

        <form
          action=""
          onSubmit={handleSendMessage}
          className="absolute bottom-0 left-0 w-full p-4 flex space-x-2 z-10"
        >
          <div className="flex justify-between  w-full ">
            <input
              type="text"
              placeholder="Type a message.."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 py-2 px-4 rounded-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
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

export default ChatRoom;
