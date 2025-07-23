import type React from "react";
import { useState } from "react";
import chat from "../asset/chat.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import whatsapp from "../asset/whatsapp.jpg";
// import DashboardLayout from "../components/DashboardLayout";
// import SignUp from "../components/SignUp";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from "../services/firebaseconfig.ts";

type loginProps = {
  // setRegisteredUser: React.Dispatch<React.SetStateAction<string | null>>;
  registeredUser: string | null;
};
const Login = ({ registeredUser }: loginProps) => {
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
      // const payload = JSON.stringify(body);
      const response = await axios.post(`${url}/api/v1/login`, body, config);
      const data = response.data;
      // setRegisteredUser(data.user?.name)
      console.log("login successfull");
      const { token } = data;
      localStorage.setItem("authToken", token);
      console.log("attempting to navigate to dashboard");
      navigate("/dashboard");
      console.log("navigation successful");
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
      <div className="lg:mb-5">
        <div
          className="flex  h-screen w-screen lg:w-[80%] m-auto lg:mt-10 bg-[#F2EFED]"
          style={{
            backgroundImage: `url(${whatsapp})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <form
            className=" lg:w-[60%] w-screen mt-10 gap-y-5 "
            onSubmit={handleForm}
          >
            <p className="text-[30px] text-bold text-white capitalize text-center pt-5 ">
              {registeredUser ? `Login here ${registeredUser}!` : "Login here!"}
            </p>

            <div className="flex flex-col gap-y-3 mt-3">
              <input
                type="text"
                placeholder="Email"
                className="border-2  w-[80%] lg:w-[60%]  m-auto rounded p-2 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // required
              />
              <input
                type="password"
                placeholder="Password"
                className="border-2  w-[80%] lg:w-[60%]  outline-none m-auto rounded p-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // required
              />
            </div>
            {error && (
              <p className="text-red-500 lg:w-[50%] m-auto lg:ml-[130px] text-center mt-3">
                {error}
              </p>
            )}
            <div className="flex   items-center lg:pl-[60px] gap-x-10 lg:gap-x-20 w-[80%] mt-10 m-auto">
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
          <img
            src={chat}
            alt="text image"
            className="w-[40%] h-screen hidden lg:block"
          />
        </div>
      </div>
    </>
  );
};

export default Login;

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
