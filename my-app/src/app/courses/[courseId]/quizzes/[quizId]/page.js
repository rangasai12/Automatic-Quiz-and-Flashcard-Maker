"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QuizDetails() {
  const { courseId, quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuiz = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first.");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Quiz not found");
        const data = await res.json();
        setQuiz(data.quiz);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchQuiz();
  }, [quizId]);

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg">
      {error && <p className="text-red-600">{error}</p>}
      {quiz ? (
        <div>
          <h1 className="text-4xl font-extrabold mb-6 text-gray-800">{quiz.topic}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quiz.questions.map((quizItem, index) => (
              <div key={index} className="border border-gray-200 p-6 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200 ease-in-out shadow-sm hover:shadow-md">
                <h2 className="text-xl font-semibold text-gray-900">{quizItem.title}</h2>
                <ul className="mt-2 space-y-1">
                  {quizItem.questions.map((q, qIndex) => (
                    <li key={qIndex} className="border p-2 rounded">
                      <p className="text-gray-900">{q.question}</p>
                      <hr className="my-2 border-gray-300" />
                      <ul className="mt-1 space-y-1">
                        {q.options.map((option, oIndex) => (
                          <li key={oIndex} className={`p-1 ${option.is_correct ? 'bg-green-100' : ''}`}>
                            <span className="text-gray-900">{option.text}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Loading quiz...</p>
      )}
    </div>
  );
}
