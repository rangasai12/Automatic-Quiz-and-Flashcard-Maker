"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function GenerateQuiz() {
  const { courseId } = useParams();
  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleQuizGeneration = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login first.");
      setLoading(false);
      return;
    }

    if (!file) {
      setError("Please upload a file.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/generate-quiz/?topic=${encodeURIComponent(topic)}&num_questions=${numQuestions}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "accept": "application/json"
      },
      body: formData,
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error generating quiz.");
    } else {
      router.push(`/courses/${courseId}/quizzes`);
    }
  };

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-800">Generate a New Quiz</h1>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={handleQuizGeneration} className="space-y-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-2 border border-gray-200 rounded"
          required
        />
        <input
          type="text"
          placeholder="Quiz Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded text-black"
          required
        />
        <input
          type="number"
          placeholder="Number of Questions"
          value={numQuestions}
          onChange={(e) => setNumQuestions(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded text-black"
          required
        />
        <button type="submit" className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
          Generate Quiz
        </button>
      </form>
      {loading && <p className="text-gray-600 mt-4">Loading...</p>}
    </div>
  );
}
