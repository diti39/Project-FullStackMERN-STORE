export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const btn = "rounded-md border px-3 py-1.5 text-sm";
  const numbers =
    pages <= 7 ? Array.from({ length: pages }, (_, i) => i + 1) : null;

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-2"
      aria-label="Pagination"
    >
      <button
        className={`${btn} border-gray-300 hover:bg-gray-100 disabled:opacity-40`}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>

      {numbers ? (
        numbers.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${btn} ${
              n === page
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            {n}
          </button>
        ))
      ) : (
        <span className="px-2 text-sm text-gray-600">
          Page {page} of {pages}
        </span>
      )}

      <button
        className={`${btn} border-gray-300 hover:bg-gray-100 disabled:opacity-40`}
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
