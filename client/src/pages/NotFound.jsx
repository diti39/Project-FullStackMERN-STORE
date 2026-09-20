import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">That page doesn't exist.</p>
      <Link
        to="/"
        className="mt-4 inline-block text-indigo-600 hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
