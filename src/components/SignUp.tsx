import React, { useState } from "react";
import chat from "../asset/chat.jpg";
import whatsapp from "../asset/whatsapp.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import { FaEye } from "react-icons/fa";
import { IoMdEyeOff } from "react-icons/io";
interface signUpProps {
  setRegisteredUser: React.Dispatch<React.SetStateAction<string | null>>;
}

const SignUp = ({ setRegisteredUser }: signUpProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const[clientError, setClientError] = useState({name: '', password:"", email: ""})
  const [eyeMonitor, setEyeMonitor] = useState(false);


  const formValidation = () => {
    let isValid = true
    const errors = {email: "", password:"", name: ""}

    if(name.length < 3) {
      errors.name = 'name must be more than 3 characters'
      isValid = false
    }
    if(!email.includes("@") || !email.includes('.')) {
      errors.email = 'provide valid email'
      isValid = false

    }
     if(password.length < 3) {
      errors.password = 'password length be more than 3 characters'
      isValid = false

    }
    setClientError(errors)

    if(!isValid) {
      setError(errors.name || errors.email || errors.password)
    }

    return isValid
  }

  const handleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formValidation ()) return;
    if (!check) {
      setError("please agree to the terms and privacy");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const url = import.meta.env.VITE_API_URL;
      const config = {
        headers: {
          "content-type": "application/json",
        },
      };
      const body = { username: name, email, password };
      const payload = JSON.stringify(body);
      const response = await axios.post(
        `${url}/api/v1/register`,
        payload,
        config
      );
      const data = response.data;
      setRegisteredUser(data?.user?.name);
      const { token } = data;
      localStorage.setItem("regToken:", token);
      navigate("login");
    } catch (err: any) {
      console.log("Error:", err);
      const errorMessage =
        err.response.data?.err?.message ||
        "An unexpected error occurred!, try again";
      console.log("Specific error message:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate("/login");
    console.log("login");
  };

  const handleViewPassword = () => {
    setEyeMonitor(!eyeMonitor);
  };

  return (
    <>
      <div
        className="lg:pb-5 pt-10 h-screen animate-slide-in"
        style={{
          backgroundImage: `url(${whatsapp})`, backgroundSize:'cover', animationDelay: "0.4s" ,
        }}
      >

        <div
          className="flex h-full lg:w-[80%] mt-10 sm:m-auto md: rounded-md md:bg-[#F2EFED]"
        >

          <form
            className="space-y-10 md:space-y-6 w-full mt-10 md:mt-0 gap-y-5" 
            onSubmit={handleForm}
          >
            <p className="text-[30px] text-white md:text-black text-bold capitalize text-center pt-5 w-fit m-auto ">
              create account
            </p>

            <div className="flex flex-col gap-y-3 mt-3">

              <input
                type="text"
                placeholder="Name"
                className="border-2 w-[80%] lg:w-[60%]   m-auto rounded p-2 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                // required
              />
              {clientError.name && <p className="text-red-500 ml-10 md:ml-32 text-[14px] ">{clientError.name}</p>}

              <input
                type="text"
                placeholder="Email"
                className="border-2 w-[80%] lg:w-[60%] m-auto rounded p-2 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // required
              />
              {clientError.email && <p className="text-red-500 ml-10 md:ml-32 text-[14px]  ">{clientError.email}</p>}

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
                    <IoMdEyeOff onClick={handleViewPassword} className="cursor-pointer" />
                  ) : (
                  <FaEye onClick={handleViewPassword} className="cursor-pointer" />
                  )}
                </div>

                </div>
                {clientError.password && <p className="text-red-500 ml-10 md:ml-32 text-[14px]  ">{clientError.password}</p>}

            </div> 

            {error && (
              <p className="text-red-500 lg:w-[50%] lg:ml-[130px] m-auto text-center mt-3 md:mt-0 text-[14px] ">
                {error}
              </p>
            )}

            <div className="flex items-center gap-x-3 mt-10 w-fit m-auto px-5 md:px-2 borde">
              <input
                type="checkbox"
                checked={check}
                onChange={(e) => setCheck(e.target.checked)}
              />

              <p className="text-white md:text-black text-[14px]">
                I agree to the terms and privacy policy
              </p>

            </div>

            <div className="flex justify-between items-center gap-x-8 w-[80%] md:w-[60%] mt-10 ml-8 md:m-auto pb-2">
              
              <button
                onClick={handleForm}
                type="submit"
                className="border bg-black py-3 px-10 rounded text-white"
              >
                {loading ? <ClipLoader size={18} color={"#ffffff"} /> : <p>SignUp</p>}

              </button>

              <button
                onClick={handleLogin}
                type="button"
                className="border bg-black px-12 py-3 rounded text-white"
              >
                login
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

export default SignUp;


