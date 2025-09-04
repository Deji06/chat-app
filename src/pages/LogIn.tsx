import type React from "react";
import { useState } from "react";
import chat from "../asset/chat.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import whatsapp from "../asset/whatsapp.jpg";
import ClipLoader from "react-spinners/ClipLoader";
import { FaEye } from "react-icons/fa";
import { IoMdEyeOff } from "react-icons/io";
// import { includes } from "lodash";

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
  const [Usererror, setUserError] = useState({ email: "", password: "" });
  const [eyeMonitor, setEyeMonitor] = useState(false);

  const validateForm = () => {
    let isValid = true;
    const errors = { email: "", password: "" };

    if (!email.includes("@") || !email.includes(".")) {
      errors.email = "provide valid email address";
      isValid = false;
    }

    if (password.length < 3) {
      errors.password = "password must be more than 3 characters";
      isValid = false;
    }
    setUserError(errors);
    if (!isValid) {
      setError(errors.email || errors.password);
    }

    return isValid;
  };

  const handleSignUp = () => {
    navigate("/");
  };

  const handleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const url = import.meta.env.VITE_API_URL;
    const config = {
      headers: {
        "content-type": "application/json",
      },
    };
    try {
      setLoading(true);
      setError(null);
      const body = { email, password };
      const response = await axios.post(`${url}/api/v1/login`, body, config);
      const data = response.data;
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

  const handleViewPassword = () => {
    setEyeMonitor(!eyeMonitor);
  };

  return (
    <>
      <div
        className="lg:pb-5 pt-10 h-screen animate-slide-in"
        style={{
          backgroundImage: `url(${whatsapp})`,
          backgroundSize: "cover",
          animationDelay: "0.8s",
        }}
      >
        <div className="flex h-full lg:w-[80%] mt-10 sm:m-auto md: rounded-md md:bg-[#F2EFED]">
          <form
            className="space-y-10 md:space-y-6 w-full mt-10 md:mt-0 gap-y-5 md:py-20"
            onSubmit={handleForm}
          >
            <p className="text-[30px] text-bold text-white md:text-black capitalize text-center pt-5 ">
              {registeredUser
                ? `Login here ${registeredUser}!`
                : "Hello, Login here !"}
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
              {Usererror.email && (
                <p className="text-red-500 ml-10 md:ml-32 text-[14px] ">
                  {Usererror.email}
                </p>
              )}

              <div className="border-2 w-[80%] lg:w-[60%] m-auto rounded p-2 outline-none flex justify-between bg-white">
                <input
                  type={eyeMonitor ? "text" : "password"}
                  name="password"
                  placeholder="Enter Password"
                  className=" outline-none w-full text-sm"
                  onChange={(e) => setPassword(e.target.value)}
                  // required
                />

                <div>
                  {eyeMonitor ? (
                    <IoMdEyeOff
                      onClick={handleViewPassword}
                      className="cursor-pointer"
                    />
                  ) : (
                    <FaEye
                      onClick={handleViewPassword}
                      className="cursor-pointer"
                    />
                  )}
                </div>
              </div>
            {Usererror.password && <p className="text-red-500 ml-10 md:ml-32 text-[14px] " >{Usererror.password}</p>}
            </div>

            {error && (
              <p className="text-red-500 lg:w-[50%] m-auto lg:ml-[130px] text-center mt-3 text-[14px] ">
                {error}
              </p>
            )}

            <div className="flex justify-between items-center gap-x-10 w-[80%] md:w-[60%] mt-10 m-auto ">
              <button
                onClick={handleForm}
                type="submit"
                className="border bg-black px-10 py-3 rounded text-white"
              >
                {loading ? (
                  <ClipLoader size={18} color={"#ffffff"} />
                ) : (
                  <p className="whitespace-nowrap">Login</p>
                )}
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
            className="w-[50%] min-h-full hidden lg:block border-2"
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
