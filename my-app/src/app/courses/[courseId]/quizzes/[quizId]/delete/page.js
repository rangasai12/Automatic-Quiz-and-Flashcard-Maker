"use client";

import { useParams, useRouter } from "next/navigation";

export default function DeleteQuiz() {
  const { courseId, quizId } = useParams();
  const router = useRouter();

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first.");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/quizzes/${quizId}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      router.push(`/courses/${courseId}/quizzes`);
    } else {
      alert("Error deleting quiz.");
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Are you sure?</h1>
      <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded">
        Delete Quiz
      </button>
    </div>
  );
}
