"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function QuizzesPage() {
  const { courseId } = useParams();
  const [quizzes, setQuizzes] = useState([]);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchQuizzes = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first.");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/quizzes/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch quizzes");
        const data = await res.json();
        setQuizzes(data.quizzes);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchQuizzes();
  }, [courseId]);

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-800">Quizzes</h1>
      <Link href={`/courses/${courseId}/quizzes/new`}>
        <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out mb-6">
          Generate New Quiz
        </button>
      </Link>

      {error && <p className="text-red-600">{error}</p>}
      {quizzes.length === 0 && !error && <p className="text-gray-600">No quizzes found.</p>}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <li key={quiz._id} className="border border-gray-200 p-6 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200 ease-in-out shadow-sm hover:shadow-md">
            <Link href={`/courses/${courseId}/quizzes/${quiz._id}${quiz.percentage_score === null ? '/start' : ''}`}>
              <h2 className="text-xl font-semibold text-gray-700">{quiz.topic}</h2>
            </Link>
            <p className="text-sm text-gray-500">
              {quiz.percentage_score === null ? "Not taken yet" : "Quiz completed"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
