"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function FlashcardsByTopic() {
  const { courseId, topicName } = useParams();
  const [flashcards, setFlashcards] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFlashcards = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first.");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/flashcards/${topicName}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Flashcards not found for the given topic");
        const data = await res.json();
        setFlashcards(data.flashcards);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchFlashcards();
  }, [courseId, topicName]);

  const [flipped, setFlipped] = useState(Array(flashcards.length).fill(false));

  const handleFlip = (index) => {
    setFlipped((prevFlipped) => {
      const newFlipped = [...prevFlipped];
      newFlipped[index] = !newFlipped[index];
      return newFlipped;
    });
  };

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg">
      {error && <p className="text-red-600">{error}</p>}
      {flashcards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcards.map((flashcard, index) => (
            <div
              key={index}
              className={`border border-gray-200 p-6 rounded-lg cursor-pointer hover:bg-gray-50 transition duration-200 ease-in-out shadow-sm hover:shadow-md ${!flipped[index] ? 'bg-blue-50' : ''}`}
              onClick={() => handleFlip(index)}
            >
              <p className="text-gray-900">{flipped[index] ? flashcard.back : flashcard.front}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Loading flashcards...</p>
      )}
    </div>
  );
}






