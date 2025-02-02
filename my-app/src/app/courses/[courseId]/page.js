"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CourseDetails() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchCourse = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first.");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Course not found");
        const data = await res.json();
        setCourse(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchCourse();
  }, [courseId]);

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg">
      {error && <p className="text-red-600">{error}</p>}
      {course ? (
        <div>
          <h1 className="text-4xl font-extrabold mb-6 text-gray-800">{course.name}</h1>
          <p className="text-gray-700 mt-4">Course ID: {course._id}</p>
          <p className="text-gray-700 mt-2">Created At: {new Date(course.created_at).toLocaleDateString()}</p>
          <p className="text-gray-700 mt-2">Number of Quizzes: {course.number_of_quizzes}</p>
          <p className="text-gray-700 mt-2">Average Score: {course.average_score.toFixed(2)}</p>
          <div className="mt-4 flex space-x-4">
            <button 
              onClick={() => router.push(`/courses/${courseId}/quizzes`)} 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out"
            >
              View Quizzes
            </button>
            <button 
              onClick={() => router.push(`/courses/${courseId}/flashcards`)} 
              className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out"
            >
              View Flashcards
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Loading course...</p>
      )}
    </div>
  );
}
