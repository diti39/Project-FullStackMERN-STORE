export default function ErrorMessage({ children }) {
  if (!children) return null;
  return (
    <div
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
    >
      {children}
    </div>
  );
}
