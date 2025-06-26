import React, { useState } from "react";
import chat from "../asset/chat.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// import { auth } from "../services/firebaseconfig.ts";
// import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
// import LogIn from "../pages/LogIn.tsx";
// import LogIn from "./LogIn.tsx";
// type Props = {}
interface signUpProps {
  setRegisteredUser: React.Dispatch<React.SetStateAction<string | null>>
}

const SignUp = ({setRegisteredUser}:signUpProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [registeredUser, setRegisteredUser] = useState("");

  const handleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!check) {
      setError('please agree to the terms and privacy')
      setLoading(false)
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
      // console.log("sign up successful...", data);
      setRegisteredUser(data?.user?.name);
      const{token} = data
      localStorage.setItem('regToken:', token)
      // console.log('registered user:', data?.user?.name);
      navigate("login");
    } catch (err: any) {
      console.log("Error:", err);
      const errorMessage =
        err.response.data?.err?.message || "An unexpected error occurred!, try again";
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

  return (
    <>
      <div className="pb-5">
        <div className="flex border w-[80%] m-auto mt-10 bg-[#F2EFED]">
          <form className=" w-[60%] mt-10 gap-y-5" onSubmit={handleForm}>
            <p className="text-[30px] text-bold capitalize text-center pt-5 ">
              create account
            </p>

            <div className="flex flex-col gap-y-3 mt-3">
              <input
                type="text"
                placeholder="Name"
                className="border-2 w-[60%] m-auto rounded p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                // required
              />
              <input
                type="text"
                placeholder="Email"
                className="border-2 w-[60%] m-auto rounded p-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // required
              />
              <input
                type="password"
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
            <div className="flex items-center gap-x-3 mt-5 m-auto w-[50%]">
              <input
                type="checkbox"
                checked={check}
                onChange={(e) => setCheck(e.target.checked)}
              />
              <p>I agree to the terms and privacy policy</p>
            </div>
            <div className="flex   items-center pl-[60px] gap-x-20 w-[80%] mt-10 m-auto">
              <button
                onClick={(e: React.FormEvent) => {
                  handleForm(e);
                }}
                // onClick={()=> {handleSubmit()}}
                type="submit"
                className="border bg-black py-3 px-10 rounded  text-white"
              >
                {loading ? <p>signingup....</p> : <p>SignUp</p>}
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
          <img src={chat} alt="text image" className="w-[40%] h-[530px]" />
        </div>
      </div>
    </>
  );
};

export default SignUp;

// if (!check) {
//   setError("you must agree to the terms and policies before continuing");
//   return;
// }
// setLoading(true);
// try {
//   const userCredentials = await createUserWithEmailAndPassword(
//     auth,
//     email,
//     password
//   );
//   await updateProfile(userCredentials.user, {
//     displayName: name,
//   });
//   // await new Promise((resolve) => setTimeout(resolve, 1000));
//   navigate("/login");
//   console.log("navigated to login");
// } catch (error: any) {
//   console.log(error);
//   if (error.code === "auth/email-already-in-use") {
//     setError("This email is already in use. Try another one.");
//   } else if (error.code === "auth/invalid-email") {
//     setError("Please enter a valid email address.");
//   } else if (error.code === "auth/weak-password") {
//     setError("Password should be at least 6 characters.");
//   } else {
//     setError("Something went wrong. Please try again.");
//   }
//   setLoading(false);
// } finally {
//   setLoading(false);
// }
