import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
// import ChatRoom from "../components/ChatRoom";
import { BsChatTextFill } from "react-icons/bs";
import { FaUser } from "react-icons/fa";
// import { FaRocketchat } from "react-icons/fa";

interface Users {
  _id: string;
  email: string;
  username: string;
  // count:numb
}

const UserList = () => {
  const navigate = useNavigate();
  // const{otherUserId} = useParams<{otherUserId:string}>()
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  // const[userName, setUserName] = useState([])

  useEffect(() => {
    const getUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("authToken");

        if (!token) {
          console.log('no toekn found');
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
        setUserList(fetchUsers.data.data || []);
        setUserCount(fetchUsers.data.count);
        // setUserName(fetchUsers.data)
        // console.log('users:' , ... userName);
        

        // console.log("backend List:", fetchUsers.data);
        // console.log("user List:", fetchUsers.data.data);
      } catch (error: any) {
        console.error("error fetching users", error);
        const errorMessage = error.fetchUsers.data.msg;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, [navigate]);

    // Function to handle clicking on a user to start a chat
  const handleUserClick = (UserId: string) => {
    console.log(`[UserList] Navigating to chat with user ID: ${UserId}`);
    navigate(`/dashboard/${UserId}`); // Navigate to the dashboard route with the user's ID
  };

  return (
    <div className="bg-[#1B1C1D] flex flex-col h-screen">
      {loading && (
        <div className="flex justify-center items-center flex-1">
          <p className="text-white text-[20px]">Loading users....</p>
        </div>
      )}

      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && userList.length === 0 && (
        <p className="text-gray-400 text-center mt-4">No other users found. Please register more users.</p>
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

              <ul className="space-y-5 flex-1 overflow-y-auto scrollbar-hide">
                {userList.map((user: Users) => {
                  const { _id: id, username , email} = user;
                  return (
                    <li key={id}>
                      <button
                        className="w-full text-left p-2 rounded hover:bg-gray-600 transition-colors flex items-center gap-x-5"
                        onClick={() => handleUserClick(id)}
                      >
                        <FaUser className="border rounded-full bg-blue-500 text-[#CCCDDE] border-gray-600 w-9 h-9 p-1.5" />
                        <div className="flex flex-col pt-">
                          <p className="text-white">{username}</p>
                          {/* <p className="text-white">{email}</p> */}
                          <h1 className="text-[#CCCDDE]">hi</h1>
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
