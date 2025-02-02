"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddCourse() {
  const [courseName, setCourseName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login first.");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/?course_name=${courseName}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Error creating course.");
    } else {
      router.push("/courses");
    }
  };

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-800">Create a New Course</h1>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={handleCreateCourse} className="space-y-4">
        <input
          type="text"
          placeholder="Course Name"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
          Create Course
        </button>
      </form>
    </div>
  );
}
