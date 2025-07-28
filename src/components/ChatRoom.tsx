import React, { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
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
  reciever: { _id: string; name?: string; email: string; username?: string };
  sender: { _id: string; name?: string; email: string; username: string };
  content: string;
  createdAt: string | Date;
  readBy: string[];
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
  const socketRef = useRef<Socket | null>(null);
  const otherUserIdRef = useRef(otherUserId);

  const getCurrentUserIdFromToken = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("no current user id is found in authToken");
      return null;
    }
    try {
      const decodedToken: any = JSON.parse(atob(token.split(".")[1]));
      // console.log("current user id:", decodedToken.userId);

      return decodedToken.userId;
    } catch (error) {
      console.error("error fetching id", error);
      setError("something went wrong, try later!");
      return null;
    }
  };

  // useeffect 1  to ensure smooth scrolling to the last message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // useeffect to get currentuserId
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
        }
        return;
      }

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

        // console.log("other users id :", response.data);

        setOtherUser(foundOtherUser || null);

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
  // useEffect(() => {
  //   const fetchChatHistory = async () => {
  //     const token = localStorage.getItem("authToken");
  //     const currentUserId = currentUserIdRef.current;

  //     if (!token || !otherUserId || !currentUserId) {
  //       console.log(
  //         "Cannot fetch chat history: Missing token, otherUserId, or currentUserId."
  //       );
  //       if (!currentUserId) {
  //         console.log(
  //           "[EFFECT 3 REDUNDANT NAV] currentUserId missing, navigating to /login (Effect 3)."
  //         );
  //         navigate("/login");
  //       }

  //       return;
  //     }
  //     console.log(
  //       `[EFFECT 3 API CALL] Token present, IDs present. Making GET /api/v1/messages/${otherUserId}`
  //     );

  //     setLoading(true);
  //     setError(null);
  //     try {
  //       const url = import.meta.env.VITE_API_URL;
  //       if (!url) {
  //         console.error(
  //           "VITE_API_URL is not defined in environment variables!"
  //         );
  //         setError("Backend API URL is not configured correctly.");
  //         setLoading(false);
  //         return;
  //       }

  //       const config = {
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //       };

  //       const response = await axios.get<
  //         any,
  //         { data: { messages: Message[] } }
  //       >(`${url}/api/v1/messages?otherUserId=${otherUserId}`, config);
  //       setMessages(response.data.messages);
  //     } catch (err: any) {
  //       console.error("Error fetching chat history:", err);
  //       if (axios.isAxiosError(err) && err.response) {
  //         setError(err.response.data?.message || "Failed to fetch messages.");
  //       } else {
  //         setError("Network error or unexpected issue.");
  //       }
  //       if (err.response?.status === 401) {
  //         navigate("/login");
  //       }
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   // Only call the fetch function if otherUserId is present and currentUserId is loaded
  //   if (otherUserId && currentUserIdRef.current) {
  //     fetchChatHistory();
  //   } else {
  //     console.log(
  //       "[EFFECT 3 END] Conditions not met for fetchChatHistory. Skipping."
  //     );
  //   }
  // }, [otherUserId, navigate]); // Dependencies: otherUserId and navigate

  useEffect(() => {
    otherUserIdRef.current = otherUserId; // Update ref when otherUserId changes
  }, [otherUserId]);

  const handleNewMessage = useCallback((message: Message) => {
    console.log("[Socket.IO] Raw message received:", message);

    if (!currentUserIdRef.current || !otherUserIdRef.current) {
      console.warn("Missing currentUserId or otherUserId");
      return;
    }

    const currentRoomId = [currentUserIdRef.current, otherUserIdRef.current]
      .sort()
      .join("-");
    const messageRoomId = [message.sender._id, message.reciever._id]
      .sort()
      .join("-");

    console.log(
      `Room check: Current ${currentRoomId} vs Message ${messageRoomId}`
    );

    if (currentRoomId === messageRoomId) {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  // USEEFFECT TO INTEGRATE SOCKET.IO
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userId = currentUserIdRef.current;

    // Ensure we have a token and user ID before attempting to connect socket
    if (!token || !userId) {
      console.log(
        "[Socket.IO Effect] Skipping socket connection: Missing token or user ID."
      );
      return;
    }
    // if (socketRef.current?.connected) return;

    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.error(
        "[Socket.IO Effect] VITE_API_URL is not defined! Cannot connect socket."
      );
      return;
    }

    if (!socketRef.current || !socketRef.current?.connected) {
      socketRef.current = io(apiUrl, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 3000,
        timeout: 20000,
        withCredentials: true,
      } as any);

      console.log("[Socket.IO Effect] Attempting to connect socket...");

      // Socket.IO event listeners
      socketRef.current.on("connect", () => {
        console.log("✅ Socket connected!");
        console.log("[Socket.IO] Connected to server:", socketRef.current?.id);

        if (otherUserIdRef.current && userId) {
          const roomId = getChatRoomId(userId, otherUserId);
          socketRef.current?.emit("joinChat", { room: roomId });
          console.log(`[Socket.IO] Emitting 'joinChat' for room: ${roomId}`);
        } else {
          console.log(
            "[Socket.IO] No otherUserId or userId to join a specific room. Joining general socket."
          );
        }
      });

      socketRef.current.on("newMessage", handleNewMessage);
      socketRef.current.on("connect_error", (err) => {
        console.error("[Socket.IO] Connection Error:", err.message);
        setError(`Socket connection error: ${err.message}`);
        if (err.message === "Authentication error") {
          navigate("/login");
          localStorage.removeItem("authToken");
        }
      });

      socketRef.current.on("disconnect", (reason: string) => {
        console.log("[Socket.IO] Disconnected from server:", reason);
      });
    }

    // Cleanup
    return () => {
      if (socketRef.current) {
        console.log("Cleaning up socket listeners...");
        socketRef.current.off("newMessage", handleNewMessage);
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.off("disconnect");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [handleNewMessage, navigate]);

  const getChatRoomId = (
    user1Id: string | null | undefined,
    user2Id: string | null | undefined
  ): string => {
    if (!user1Id || !user2Id) return "invalid-room";
    return [user1Id, user2Id].sort().join("-");
  };
  // --- END: Socket.IO Connection & Event Listener ---

  // Updated handleSendMessage to use Socket.IO
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) {
      setError("No message or socket connection.");
      return;
    }

    const currentUserId = currentUserIdRef.current;
    if (!currentUserId || !otherUserId || !otherUser?._id) {
      setError("Missing user IDs or chat partner details.");
      return;
    }
    const startTime = Date.now();
    socketRef.current.emit(
      "sendMessage",
      {
        senderId: currentUserId,
        recieverId: otherUser._id,
        content: newMessage,
      },
      (response: { success: boolean; message?: Message; error?: string }) => {
        console.log(
          `[Socket.IO] Send message response after ${
            Date.now() - startTime
          }ms:`,
          response
        );
        if (response.success && response.message) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === response.message!._id)) return prev;
            return [...prev, response.message!];
          });
          setNewMessage("");
        } else {
          setError(response.error || "Failed to send message.");
        }
      }
    );
  };

  // useeffect for readreceiept feature

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("authToken");
        if (!token || !otherUserId) {
          navigate("/");
          return;
        }

        const url = import.meta.env.VITE_API_URL;
        const response = await axios.get(
          `${url}/api/v1/messages/messages?otherUserId=${otherUserId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const fetchedMessages = response.data.data.map((msg: Message) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
          readBy: msg.readBy || [],
        }));
        setMessages(fetchedMessages);

        // Mark visible messages as read
        fetchedMessages.forEach((msg: Message) => {
          if (
            msg.reciever._id === currentUserIdRef.current &&
            !msg.readBy.includes(currentUserIdRef.current)
          ) {
            socketRef.current?.emit(
              "readMessage",
              { messageId: msg._id },
              (response: any) => {
                if (!response.success) {
                  console.error(
                    "[ChatRoom] Failed to mark message as read:",
                    response.error
                  );
                }
              }
            );
          }
        });
      } catch (error: any) {
        console.error("[ChatRoom] Error fetching messages:", error);
        setError(error.response?.data?.msg || "Failed to fetch messages");
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/");
        } else if (error.response?.status === 400) {
          setError("Invalid user ID. Please try another chat.");
        } else {
          setError(
            error.response?.data?.msg ||
              "Failed to fetch messages. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };
    if (otherUserId && currentUserIdRef.current) {
      fetchMessages();
    }
    fetchMessages();
  }, [otherUserId, navigate]);

  return (
    <>
{/* 
        {loading && (
        <div className="flex justify-center items-center flex-1">
          <p className="text-white text-[20px]">Loading chat....</p>
        </div>
      )} */}
    
      <div
        className="h-screen flex flex-col  relative "
        style={{
          backgroundImage: `url(${whatsapp})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <div className="flex shrink-0 items-center gap-x-8 bg-[#1B1C1D] py-3 px-5">
          <IoArrowUndoSharp
            className="text-white md:hidden "
            onClick={() => navigate("/dashboard")}
          />
          <div className="flex items-center gap-x-2">
            <FaUser className="border rounded-full bg-blue-800 text-[#8d8d89] border-gray-600 w-9 h-9 p-1.5" />
            <h1 className="text-white">
              {otherUser ? otherUser?.username || otherUser.name : "chat room"}
            </h1>
          </div>
        </div>

        <div className="mt-1 flex-1 overflow-y-auto scrollbar-hide px-4 pb-20 space-y-1 ">
          {messages.length === 0 ? (
            otherUser?.username ? (
              <h1 className="text-white flex flex-1 items-center justify-center  text-[20px] w-[90%] bg-gray-800 bg-opacity-40 py-3">
                start converstion with {otherUser.username}!
              </h1>
            ) : (
              <h1 className="text-white flex flex-1 items-center justify-center  text-[20px] w-[90%] m-auto bg-gray-800 bg-opacity-40 py-3">
                start converstion!
              </h1>
            )
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={` flex  px-2  ${
                  message.sender._id === currentUserIdRef.current
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`borde flex items-cente gap-x-2 w-fit px-5 py-1 rounded-xl ${
                    message.sender._id === currentUserIdRef.current
                      ? "bg-blue-800 "
                      : "bg-[#1B1C1D]"
                  } `}
                >
                  <p className="text-white text-[14px] ">{message.content}</p>
                  <p className="text mt-3 text-gray-400 text-[12px]">
                    {new Date(message.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Africa/Lagos",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          action=""
          onSubmit={handleSendMessage}
          className="absolute bottom-0 left-0 w-full mb- flex space-x-2 z-10"
        >
          <div className="flex justify-between  w-full ">
            <input
              type="text"
              placeholder="Type a message....."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 py-2 px-4 rounded-full md:rounded-none border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-800 bg-gray-700 text-white"
            />

            <button
              type="submit"
              className=" hover:bg-[#303030] text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
              <IoMdSend className="text-[30px] text-blue-800" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatRoom;
