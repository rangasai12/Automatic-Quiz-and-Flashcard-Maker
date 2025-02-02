"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.detail || "Login failed");
    } else {
      localStorage.setItem("token", data.access_token);
      router.push("/courses");
    }
  };

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg text-center">
      <h2 className="text-4xl font-extrabold mb-6 text-gray-700">Login</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded mb-2 text-gray-700"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-2 text-gray-700"
          required
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out"
        >
          Login
        </button>
      </form>
      <p className="mt-4 text-gray-700">
        Don't have an account?{" "}
        <a href="/register" className="text-blue-500">
          Register
        </a>
      </p>
    </div>
  );
}
