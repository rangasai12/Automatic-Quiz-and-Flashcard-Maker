"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function GenerateFlashcards() {
  const { courseId } = useParams();
  const [file, setFile] = useState(null);
  const [topic, setTopic] = useState("");
  const [numFlashcards, setNumFlashcards] = useState(10);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFlashcardGeneration = async (e) => {
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

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/generate-flashcards/?topic=${encodeURIComponent(topic)}&num_flashcards=${numFlashcards}`, {
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
      setError(data.error || "Error generating flashcards.");
    } else {
      router.push(`/courses/${courseId}/flashcards`);
    }
  };

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-800">Generate New Flashcards</h1>
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={handleFlashcardGeneration} className="space-y-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-2 border border-gray-200 rounded"
          required
        />
        <input
          type="text"
          placeholder="Flashcard Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded text-black"
          required
        />
        <input
          type="number"
          placeholder="Number of Flashcards"
          value={numFlashcards}
          onChange={(e) => setNumFlashcards(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded text-black"
          required
        />
        <button type="submit" className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
          Generate Flashcards
        </button>
      </form>
      {loading && <p className="text-gray-600 mt-4">Loading...</p>}
    </div>
  );
}
