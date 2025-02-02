import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg text-center">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-800">Welcome to Quiz App 🎓</h1>
      <p className="text-lg text-gray-700 mb-8">
        Generate AI-powered quizzes and track your learning progress.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/register">
          <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
            Get Started
          </button>
        </Link>
        <Link href="/courses">
          <button className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
            View Courses
          </button>
        </Link>
      </div>
    </div>
  );
}
