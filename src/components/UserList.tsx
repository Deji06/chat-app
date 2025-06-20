import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ChatRoom from "../components/ChatRoom";
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
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const[userName, setUserName] = useState([])

  useEffect(() => {
    const getUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("authToken");

        if (!token) {
          navigate("/");
          return;
        }

        const url = import.meta.env.VITE_API_URL;
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        const fetchUsers = await axios.get(`${url}/api/v1/users`, config);
        setUserList(fetchUsers.data.data || []);
        setUserCount(fetchUsers.data.count);
        setUserName(fetchUsers.data)
        // console.log('users:' , ... userName);
        

        console.log("backend List:", fetchUsers.data);
        console.log("user List:", fetchUsers.data.data);
      } catch (error: any) {
        console.error("error fetching users", error);
        const errorMessage = error.fetchUsers.data.msg;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, []);

  return (
    <div className="bg-[#1B1C1D] pb-1">
      {loading && (
        <div className="flex justify-center items-center w-full mt-20">
          <p className="text-white text-[20px]">Loading users....</p>
        </div>
      )}

      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && userList.length > 0 && (
        <>
          <div className="flex justify-between pt px-">
            {/* left container */}
            <div className="w-[30%] px-3 pt-5 h-screen overflow-y-auto scrollbar-hide">
              <div className="flex justify-between">
                <p className="text-white capitalize text-[18px]">chats</p>

                <div className="relative w-[20%]">
                  <BsChatTextFill className="text-[20px]" />
                  <p className="text-black text-[14px] absolute top-[-10px] left-5 border bg-white rounded-full flex items-center h-5 w-5">
                    {userCount}
                  </p>
                </div>
              </div>

              <ul className="space-y-5 mt-3">
                {userList.map((user: Users) => {
                  const { _id: id, username } = user;
                  return (
                    <li key={id}>
                      <button
                        className="w-full text-left p-2 rounded hover:bg-gray-600 transition-colors flex items-center gap-x-5"
                        onClick={() => ""}
                      >
                        <FaUser className="border rounded-full bg-[#303030] text-[#CCCDDE] border-gray-600 w-9 h-9 p-1.5" />
                        <div className="flex flex-col pt-">
                          <p className="text-white">{username}</p>
                          <h1 className="text-[#CCCDDE]">hi</h1>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            {/* right container */}
            <div className="w-[100%]">
              <ChatRoom />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserList;
