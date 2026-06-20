import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

import IconLogin from "../components/SVG/IconLogin";
import IconEye from "../components/SVG/IconEye";
import IconEyeInvisible from "../components/SVG/IconEyeInvisible";
import ProgressBar from "../tools/ProgressBar";
import { serverIP } from "../api";
import { AiFillHome } from 'react-icons/ai';
import packageJson from "../../package.json";
const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { saveAuthData } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${serverIP}api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        const { token, user } = data;
        const { id, name, role, department, surname, email } = user;

        // Use the centralized saveAuthData function
        saveAuthData(
          token,
          role,
          id,
          name,
          department,
          surname,
          email,
          rememberMe
        );

        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/calendar");
        }
      } else {
        setError(
          " " + (data.message || "Please check your credentials and try again.")
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[100vh] flex items-center justify-center px-5 lg:px-0 overflow-hidden bg-[#1e3a8a]">
      {/* Static background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[180vh] h-[180vh] -bottom-[120vh] -left-[20vh] bg-[#60a5fa] rounded-[50%] opacity-20"></div>
        <div className="absolute w-[160vh] h-[160vh] -bottom-[100vh] -left-[10vh] bg-[#3b82f6] rounded-[50%] opacity-30"></div>
        <div className="absolute w-[140vh] h-[140vh] -bottom-[80vh] left-0 bg-[#2563eb] rounded-[50%] opacity-40"></div>
        <div className="absolute w-[120vh] h-[120vh] -bottom-[60vh] left-[10vh] bg-[#1d4ed8] rounded-[50%] opacity-50"></div>
        <div className="absolute w-[100vh] h-[100vh] -bottom-[40vh] left-[20vh] bg-[#1e40af] rounded-[50%] opacity-60"></div>
        <div className="absolute w-[80vh] h-[80vh] -bottom-[20vh] left-[30vh] bg-[#1e3a8a] rounded-[50%] opacity-70"></div>
      </div>

      {/* Glass panel effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1e3a8a]/10 to-[#1e3a8a]/30"></div>

      {/* Login form */}
      <div className="max-w-screen-xl relative z-10 sm:rounded-lg flex justify-center flex-1   rounded-2xl ">
        <div className="flex-1 rounded-s-xl bg-transparent text-center hidden md:flex">
        <div
            className="m-12 xl:m-16 w-full bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/sunvalley-logo-bg.png')",
            }}
          ></div>
        </div>
        <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12 bg-white rounded-lg shadow-xl">
          <div className="flex flex-col items-center">
            <div className="text-center mb-0">
              <h1 className="text-3xl xl:text-4xl font-bold text-yellow-400 tracking-tight flex items-center gap-2">
                {/* <AiFillHome className="text-yellow-400 w-10 h-10" /> */}
                Sun Valley Meeting Point
              </h1>
              <p className="mt-2 text-gray-400">Please sign in to continue</p>
            </div>
            <form onSubmit={handleLogin} className="w-full flex-1 mt-2">
              <div className="mx-auto max-w-xs flex flex-col gap-4">
                {/* Username input */}
                <div className="relative h-11 w-full min-w-[200px]">
                  <input
                    placeholder=""
                    type="text"
                    name="username"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="peer h-full w-full border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-base font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border-blue-gray-200 focus:border-amber-400 focus:outline-0 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:border-0 disabled:bg-blue-gray-50 placeholder:opacity-0 focus:placeholder:opacity-100"
                  />
                  <label className="after:content[''] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[12px] font-normal leading-tight text-gray-500 transition-all after:absolute after:-bottom-1.5 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-yellow-400 after:transition-transform after:duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:leading-[4.25] peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[12px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:after:scale-x-100 peer-focus:after:border-yellow-400 peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
                    Username
                  </label>
                </div>

                {/* Password input with eye icon */}
                <div className="relative h-11 w-full min-w-[200px]">
                  <input
                    placeholder=""
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer h-full w-full border-b border-blue-gray-200 bg-transparent pt-4 pb-1.5 font-sans text-base font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border-blue-gray-200 focus:border-amber-400 focus:outline-0 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:border-0 disabled:bg-blue-gray-50 placeholder:opacity-0 focus:placeholder:opacity-100"
                  />
                  <label className="after:content[''] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none !overflow-visible truncate text-[12px] font-normal leading-tight text-gray-500 transition-all after:absolute after:-bottom-1.5 after:block after:w-full after:scale-x-0 after:border-b-2 after:border-yellow-400 after:transition-transform after:duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:leading-[4.25] peer-placeholder-shown:text-blue-gray-500 peer-focus:text-[12px] peer-focus:leading-tight peer-focus:text-gray-900 peer-focus:after:scale-x-100 peer-focus:after:border-yellow-400 peer-disabled:text-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 transition-transform duration-300 ease-in-out"
                    title={showPassword ? "Hide Password" : "Show Password"}
                    aria-label={
                      showPassword ? "Hide Password" : "Show Password"
                    }
                  >
                    {showPassword ? (
                      <IconEye className="w-6 h-6" />
                    ) : (
                      <IconEyeInvisible className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-yellow-400 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 text-gray-600 text-sm"
                  >
                    Remember Me
                  </label>
                </div>

                {error && (
                  <div className="text-red-500 text-center mt-4">{error}</div>
                )}

                <button
                  type="submit"
                  className="text-xl tracking-wide font-semibold bg-yellow-400 text-gray-100 w-full py-4 rounded-lg hover:bg-yellow-500 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none"
                  disabled={loading}
                >
                  {loading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <IconLogin />
                  )}
                  <span className="ml-2">Login</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Developer credit */}
      <div className="absolute bottom-4 right-4">
        <div className="flex items-center gap-3">
          {/* <a 
            href="https://github.com/sardor1215" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
          >
            <span className="text-white/80 text-sm">Developed by</span>
            <span className="text-white font-medium text-sm">SE LAB</span>
          </a> */}
          <div className="px-2 py-1 rounded-full bg-white/5 backdrop-blur-sm">
            {/* <span className="text-white/40 text-xs font-mono">v.0.0</span> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
