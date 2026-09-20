export default function QuantityInput({ value, max, onChange }) {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-lg leading-none hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        className={btn}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
