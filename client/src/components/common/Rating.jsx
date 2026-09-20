export default function Rating({ value = 0, count, className = "" }) {
  const rounded = Math.round(value);
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span
        className="text-amber-400"
        role="img"
        aria-label={`${value} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>{n <= rounded ? "★" : "☆"}</span>
        ))}
      </span>
      {count !== undefined && (
        <span className="text-sm text-gray-500">({count})</span>
      )}
    </div>
  );
}
