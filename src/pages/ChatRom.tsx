// import React, { useEffect, useState, useRef } from "react";
// import {
//   addDoc,
//   collection,
//   serverTimestamp,
//   onSnapshot,
//   query,
//   orderBy,
// } from "firebase/firestore";
// import { db, auth } from "../services/firebaseconfig";

// const chatRoom = () => {
//   const [text, setText] = useState<string>("");
//   const [messages, setMessages] = useState<any[]>([]);
//   const bottomRef = useRef<HTMLDivElement>(null);

//   const user = auth.currentUser;

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   useEffect(() => {
//     const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       setMessages(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleMessages = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (text.trim() === "") return;
//     await addDoc(collection(db, "messages"), {
//       userName: user?.displayName || "Anonymous",
//       messageText: text,
//       createdAt: serverTimestamp(),
//     });

//     setText(""); // clear input
//   };

//   return (
//     <>
//       <div className='bg-[url("whatsapp3.jpg")] min-h-screen flex flex-col justify-between pb-4'>
//         {/* Messages Display */}
//         <div className="overflow-y-scroll p-3 flex-1 ">
//           {messages.map((msg) => (
//             <div key={msg.id} className="mb-2">
//               <p className="font-semibold text-white">{msg.userName}</p>

//               <div className="flex items-center bg-black borde gap-x-3 w-fit px-2">
//                 <p className="text-white">{msg.messageText}</p>

//                 {msg.createdAt?.toDate && (
//                   <p className="text-[10px] mt-3 mr-0 text-gray-400">
//                     {msg.createdAt
//                       .toDate()
//                       .toLocaleTimeString([], {
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       })}
//                   </p>
//                 )}

//               </div>
//             </div>
//           ))}
//           <div ref={bottomRef} />
//         </div>

//         <form
//           onSubmit={handleMessages}
//           className="flex items-center p-3 bg-black "
//         >
//           <input
//             type="text"
//             className=" bg-gray-800 w-[90%] rounded text-white px-4 py-3  outline-none"
//             placeholder="text"
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//           />
//           <button
//             type="submit"
//             className="rounded border px-10 py-3 bg-green-500 text-white"
//           >
//             send
//           </button>
//         </form>
//       </div>
//     </>
//   );
// };

// export default chatRoom;


import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
// import io from 'socket.io-client'; // Will be uncommented and used in the next Socket.IO step

// Define types for better type safety
interface User {
  _id: string;
  name?: string; // name might be optional based on your backend select
  email: string;
}

interface Message {
  _id: string;
  receiver: { _id: string; name?: string; email: string; }; // Corrected spelling to 'receiver'
  sender: { _id: string; name?: string; email: string; };
  content: string;
  createdAt: string; // Mongoose's timestamp
}

// Global socket variable placeholder (will be used with Socket.IO)
// let socket: any;

const ChatWindow = () => {
  const navigate = useNavigate();
  const { otherUserId } = useParams<{ otherUserId: string }>(); // Get otherUserId from URL params

  // State variables for component logic and UI
  const [loading, setLoading] = useState(true); // Initially loading as we fetch history
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageContent, setNewMessageContent] = useState(''); // State for the message input field
  const [otherUser, setOtherUser] = useState<User | null>(null); // State to store the other user's details

  // Refs for side effects and DOM interaction
  const currentUserIdRef = useRef<string | null>(null); // To store the logged-in user's ID persistently
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling to the bottom of messages

  // Helper function: Synchronously decodes JWT to get the current user's ID
  const getCurrentUserIdFromToken = (): string | null => {
    const token = localStorage.getItem('authToken'); // Ensure 'authToken' is the key used to store the JWT
    if (token) {
      try {
        const decodedToken: any = JSON.parse(atob(token.split('.')[1])); // Correct splitting by '.'
        return decodedToken.userId;
      } catch (e) {
        console.error("Error decoding token:", e);
        return null;
      }
    }
    return null;
  };

  // Effect 1: Set current user ID on mount and handle initial authentication check
  useEffect(() => {
    currentUserIdRef.current = getCurrentUserIdFromToken();
    if (!currentUserIdRef.current) {
      console.log('No current user ID found, navigating to login.');
      navigate('/login'); // Redirect to login if no valid token/user ID
    }
  }, [navigate]); // navigate is a dependency because it's used inside the effect

  // Effect 2: Fetch details of the other user in the chat
  useEffect(() => {
    const fetchOtherUserDetails = async () => {
      const token = localStorage.getItem('authToken');
      if (!token || !otherUserId) {
        // These checks are already done by effect 1 or later in fetchMessages
        // but can remain for robust logic within this specific fetch
        console.log('Missing token or otherUserId for fetching other user details.');
        return; 
      }

      try {
        const url = import.meta.env.VITE_API_URL; // Correct environment variable name (no '$')
        if (!url) {
          console.error("VITE_API_URL is not defined in environment variables!");
          setError("Backend API URL is not configured correctly.");
          return;
        }

        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // Fetch all users and then find the specific one
        const response = await axios.get<{data: User[]}>(`${url}/api/v1/users`, config); // Adjusted to backend response structure
        const foundUser = response.data.data.find((u: User) => u._id === otherUserId); // Access .data.data
        
        setOtherUser(foundUser || null);

        if (!foundUser) {
          setError('Chat partner not found.');
        }

      } catch (err) {
        console.error("Failed to fetch other user details:", err);
        if (axios.isAxiosError(err) && err.response) {
            setError(err.response.data?.message || 'Failed to load chat partner details.');
        } else {
            setError('Network error or unexpected issue.');
        }
      }
    };
    if (otherUserId && currentUserIdRef.current) { // Only fetch if IDs are available
      fetchOtherUserDetails();
    }
  }, [otherUserId]); // otherUserId is a dependency as we fetch based on it


  // Effect 3: Fetch initial chat history when component mounts or otherUserId changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      const token = localStorage.getItem('authToken');
      const currentUserId = currentUserIdRef.current; // Get ID from ref

      if (!token || !otherUserId || !currentUserId) {
        console.log('Cannot fetch chat history: Missing token, otherUserId, or currentUserId.');
        // Redirection handled by Effect 1
        return; 
      }

      setLoading(true); // Start loading before fetch
      setError(null); // Clear previous errors

      try {
        const url = import.meta.env.VITE_API_URL; // Correct env var name
        if (!url) {
          console.error("VITE_API_URL is not defined in environment variables!");
          setError("Backend API URL is not configured correctly.");
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        };

        const response = await axios.get<any, { data: { messages: Message[] } }>(
          `${url}/api/v1/messages/${otherUserId}`,
          config
        );
        setMessages(response.data.messages); // Update state with fetched messages

      } catch (err: any) {
        console.error('Error fetching chat history:', err);
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data?.message || 'Failed to fetch messages.');
        } else {
          setError('Network error or unexpected issue.');
        }
        if (err.response?.status === 401) {
          navigate('/login'); // Redirect if auth fails
        }
      } finally {
        setLoading(false); // End loading
      }
    };

    // Only call the fetch function if otherUserId is present and currentUserId is loaded
    if (otherUserId && currentUserIdRef.current) {
      fetchChatHistory();
    }
  }, [otherUserId, navigate]); // Dependencies: otherUserId and navigate

  // Effect 4: Auto-scroll to the latest message whenever messages state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // handleSendMessage: Function to send a new message via Axios POST
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)

    if (!newMessageContent.trim()) { 
      console.log('Attempted to send empty message.');
      return; // Stop if the input is empty
    }

    const token = localStorage.getItem("authToken"); 
    const currentUserId = currentUserIdRef.current; 

    if (!token || !otherUserId || !currentUserId) {
      console.error('Cannot send message: Missing token, otherUserId, or currentUserId.');
      navigate("/login"); 
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
          "Content-type": "application/json", 
          Authorization: `Bearer ${token}`, 
        },
      };

      const payload = {
        senderId: currentUserId,   
        receiver: otherUserId,     
        content: newMessageContent.trim(), 
      };
      
      const response = await axios.post(`${url}/api/v1/messages`, payload, config);
      const sentMessage = response.data.data;
      
      // Optimistically update UI: Add the new message to the messages state
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
      setNewMessageContent(''); // Clear the input field after successful send

    } catch (err: any) {
      console.error("Error sending message:", err); 

      let errorMessage = "Failed to send message.";
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data?.message || errorMessage;
        if (err.response.status === 401) {
          navigate('/login'); 
          localStorage.removeItem('authToken'); 
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
    }
  };


  // --- Conditional Render Logic for UI states ---
  if (!otherUserId) {
    return <div className="text-center p-4 text-red-500">No chat partner selected. Please go back to the user list.</div>;
  }
  if (loading) {
    return <div className="text-center p-4 text-gray-600">Loading conversation...</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 p-4">Error: {error}</div>;
  }
  if (!otherUser) { // If otherUserId was provided but no user found for it
    return <div className="text-center p-4 text-gray-600">Chat partner details not found.</div>;
  }


  // --- Main Component JSX ---
  return (
    <>
      {/* Main chat container: Fills screen, organizes content vertically */}
      <div className="bg-[url('whatsapp.jpg')] h-screen w-screen relative flex flex-col overflow-hidden">

        {/* Chat Header */}
        <div className="flex-shrink-0 p-4 bg-gray-800 bg-opacity-70 text-white font-bold text-lg">
          Chat with {otherUser.name || otherUser.email.split('@')[0]} {/* Display chat partner's name or email */}
        </div>

        {/* Message Display Area: Scrolls if content overflows */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <p className="text-gray-300 text-center">Start a conversation!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                // Align messages: right for current user, left for other user
                className={`flex ${msg.sender._id === currentUserIdRef.current ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-xl ${
                    msg.sender._id === currentUserIdRef.current
                      ? 'bg-blue-500 text-white rounded-br-none' // Sender's bubble
                      : 'bg-gray-200 text-gray-800 rounded-bl-none' // Receiver's bubble
                  }`}
                >
                  {/* Display sender's name for clarity in chat bubble */}
                  <p className="font-semibold text-sm mb-1">
                    {msg.sender.name || msg.sender.email.split('@')[0]}
                  </p>
                  <p>{msg.content}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          {/* Empty div for auto-scrolling to */}
          <div ref={messagesEndRef} /> 
        </div>

        {/* Message Input Form: Sticks to the bottom */}
        <form
          onSubmit={handleSendMessage}
          className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900 bg-opacity-70 flex space-x-2"
        >
          <input
            type="text"
            placeholder="Type a message.."
            value={newMessageContent} // Controlled input: value comes from state
            onChange={(e) => setNewMessageContent(e.target.value)} // Updates state on change
            className="flex-1 py-2 px-4 rounded-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatWindow;
