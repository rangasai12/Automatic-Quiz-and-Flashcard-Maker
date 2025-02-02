"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TakeQuiz() {
  const { courseId, quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const router = useRouter();

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

  const handleAnswerChange = (questionIndex, selectedAnswer) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: selectedAnswer }));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first.");
      return;
    }

    // Calculate score (assuming correct answers are stored in the quiz)
    let score = 0;
    quiz.questions[0].questions.forEach((q, index) => {
      const correctOption = q.options.find(option => option.is_correct);
      if (answers[index] === correctOption.text) {
        score += 1;
      }
    });

    // Submit score to backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quizzes/${quizId}/scores/?score=${score}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      router.push(`/courses/${courseId}/quizzes/${quizId}/scores`);
    } else {
      alert("Error submitting quiz.");
    }
  };

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg">
      {error && <p className="text-red-600">{error}</p>}
      {quiz ? (
        <div>
          <h1 className="text-4xl font-extrabold mb-6 text-gray-800">{quiz.topic}</h1>
          <form className="mt-4 space-y-4">
            {quiz.questions[0].questions.map((q, index) => (
              <div key={index} className="border border-gray-200 p-6 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200 ease-in-out shadow-sm hover:shadow-md">
                <p className="font-semibold text-gray-900">{q.question}</p>
                {q.options.map((option, i) => (
                  <div key={i} className="mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option.text}
                        onChange={() => handleAnswerChange(index, option.text)}
                        className="mr-2"
                      />
                      <span className="text-gray-900">{option.text}</span>
                    </label>
                  </div>
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out mt-4"
            >
              Submit Quiz
            </button>
          </form>
        </div>
      ) : (
        <p className="text-gray-600">Loading quiz...</p>
      )}
    </div>
  );
}
