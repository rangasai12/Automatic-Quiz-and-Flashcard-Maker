"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuizScores() {
  const { courseId, quizId } = useParams();
  const [scores, setScores] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchScores = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first.");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quizzes/${quizId}/scores/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Scores not found");
        const data = await res.json();
        setScores(data.scores);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchScores();
  }, [quizId]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Quiz Scores</h1>
      {error && <p className="text-red-500">{error}</p>}
      {scores.length === 0 && !error && <p>No scores found.</p>}

      <ul className="space-y-4">
        {scores.map((score) => (
          <li key={score._id} className="border p-4 rounded">
            <p>User ID: {score.user_id}</p>
            <p>Score: {score.score}</p>
            <p>Submitted At: {new Date(score.submitted_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
