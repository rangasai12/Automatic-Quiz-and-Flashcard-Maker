"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditCourse() {
  const { courseId } = useParams();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEditCourse = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login first.");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ new_name: newName }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.detail || "Error updating course.");
    } else {
      router.push(`/courses/${courseId}`);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Edit Course</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleEditCourse} className="space-y-4">
        <input
          type="text"
          placeholder="New Course Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded">
          Update Course
        </button>
      </form>
    </div>
  );
}
