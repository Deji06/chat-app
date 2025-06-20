import type React from "react";
import { useState } from "react";
import chat from "../../public/chat.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// import SignUp from "../components/SignUp";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "../services/firebaseconfig.ts";

interface loginProps {
  // setRegisteredUser: React.Dispatch<React.SetStateAction<string | null>>;
  registeredUser: string | null;
}
const login = ({ registeredUser }: loginProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = () => {
    navigate("/");
  };

  const handleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    // const regToken = localStorage.getItem("regToken");
    // if(!regToken) {
    //   navigate('/')
    // }
    const url = import.meta.env.VITE_API_URL;
    const config = {
      headers: {
        "content-type": "application/json",
        // Authorization: `Bearer ${regToken}`,
      },
    };
    try {
      setLoading(true);
      setError(null);
      const body = { email, password };
      const payload = JSON.stringify(body);
      const response = await axios.post(`${url}/api/v1/login`, payload, config);
      const data = response.data;
      // setRegisteredUser(data.user?.name)
      console.log("login successfull", data);
      const { token } = data;
      localStorage.setItem("authToken", token);
      navigate('/userList')
    } catch (err: any) {
      console.log("Error:", err);
      const errorMessage = err.response.data?.msg;
      console.log("specific error:", errorMessage);
      setError(errorMessage);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="pb-5">
        <div className="flex border w-[80%] m-auto mt-10 bg-[#F2EFED]">
          <form className=" w-[60%] mt-10 gap-y-5" onSubmit={handleForm}>
            <p className="text-[30px] text-bold capitalize text-center pt-5 ">
              {registeredUser ? `Login here ${registeredUser}!` : "Login here!"}
            </p>

            <div className="flex flex-col gap-y-3 mt-3">
              <input
                type="text"
                placeholder="Email"
                className="border-2 w-[60%] m-auto rounded p-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // required
              />
              <input
                type="text"
                placeholder="Password"
                className="border-2 w-[60%] m-auto rounded p-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // required
              />
            </div>
            {error && (
              <p className="text-red-500 w-[50%] ml-[130px] text-center mt-3">
                {error}
              </p>
            )}
            <div className="flex   items-center pl-[60px] gap-x-20 w-[80%] mt-10 m-auto">
              <button
                // onClick={handleLogin}
                type="submit"
                className="border bg-black px-12 py-3 rounded text-white"
              >
                {loading ? <p>logging in....</p> : <p>Login</p>}
              </button>
              <button
                onClick={handleSignUp}
                type="button"
                className="border bg-black py-3 px-10 rounded  text-white"
              >
                SignUp
              </button>
            </div>
          </form>
          <img src={chat} alt="text image" className="w-[40%] h-[530px]" />
        </div>
      </div>
    </>
  );
};

export default login;

// const handleForm = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setLoading(true);
//   try {
//     await signInWithEmailAndPassword(auth, email, password);
//     navigate("/chatRoom");
//   } catch (error: any) {
//     console.log(error);
//     if (error.code === "auth/user-not-found") {
//       setError("No account found with this email.");
//     } else if (error.code === "auth/wrong-password") {
//       setError("Incorrect password. Please try again.");
//     } else if (error.code === "auth/invalid-email") {
//       setError("Please enter a valid email address.");
//     } else {
//       setError("Login failed. Please try again.");
//     }
//   } finally {
//     setLoading(false);
//   }
// };
