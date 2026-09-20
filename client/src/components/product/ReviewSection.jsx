import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../../api/reviews";
import { getErrorMessage } from "../../api/axios";
import { formatDate } from "../../utils/format";
import Rating from "../common/Rating";
import Pagination from "../common/Pagination";
import ErrorMessage from "../common/ErrorMessage";

function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={value === n}
          className={`text-3xl leading-none ${n <= value ? "text-amber-400" : "text-gray-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// onChanged() tells the parent page to refresh the product (its average rating changed)
export default function ReviewSection({ productId, onChanged }) {
  const { user, isAdmin } = useAuth();

  const [data, setData] = useState({ reviews: [], pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0); // bump to force a reload
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProductReviews(productId, { page, limit: 5 })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError("");
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productId, page, version]);

  // Only finds the user's review if it is on the page currently shown
  const myReview = user
    ? data.reviews.find((r) => r.user?._id === user._id)
    : null;
  const showForm = user && (!myReview || editing);

  const reload = () => {
    setVersion((v) => v + 1);
    onChanged?.();
  };

  const startEdit = () => {
    setForm({ rating: myReview.rating, comment: myReview.comment });
    setFormError("");
    setEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      if (editing) {
        await updateReview(myReview._id, form);
      } else {
        await createReview(productId, form);
        setPage(1);
      }
      setEditing(false);
      setForm({ rating: 5, comment: "" });
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (review) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteReview(review._id);
      reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section className="mt-12" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-xl font-bold">
        Reviews ({data.total})
      </h2>

      {/* Write / edit form */}
      <div className="mt-4">
        {!user && (
          <p className="text-sm text-gray-600">
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:underline"
            >
              Log in
            </Link>{" "}
            to write a review.
          </p>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            <h3 className="font-medium">
              {editing ? "Edit your review" : "Write a review"}
            </h3>
            <p className="text-xs text-gray-500">
              Only customers who received this product can review it.
            </p>
            <ErrorMessage>{formError}</ErrorMessage>
            <StarInput
              value={form.rating}
              onChange={(rating) => setForm({ ...form, rating })}
            />
            <textarea
              required
              maxLength={1000}
              rows={3}
              placeholder="Share your experience..."
              aria-label="Review comment"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Submit review"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* List */}
      <div className="mt-6 space-y-4">
        <ErrorMessage>{error}</ErrorMessage>
        {loading && <p className="text-sm text-gray-500">Loading reviews...</p>}
        {!loading && data.reviews.length === 0 && !error && (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        )}

        {data.reviews.map((review) => {
          const isMine = user && review.user?._id === user._id;
          return (
            <article
              key={review._id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Rating value={review.rating} />
                  <p className="mt-1 text-sm font-medium">
                    {review.user?.name || "Deleted user"}
                    <span className="ml-2 font-normal text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  {isMine && !editing && (
                    <button
                      onClick={startEdit}
                      className="text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {(isMine || isAdmin) && (
                    <button
                      onClick={() => handleDelete(review)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                {review.comment}
              </p>
            </article>
          );
        })}
      </div>

      <Pagination page={page} pages={data.pages} onChange={setPage} />
    </section>
  );
}
