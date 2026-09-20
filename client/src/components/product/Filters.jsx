import { useEffect, useState } from "react";
import useDebounce from "../../hooks/useDebounce";

const SORTS = [
  ["newest", "Newest"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["rating", "Top rated"],
];

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

// The URL is the source of truth. This component just reads `values` and reports changes.
export default function Filters({ values, categories, onChange, onClear }) {
  const [search, setSearch] = useState(values.keyword);
  const debouncedSearch = useDebounce(search, 400);

  // Only fires when the debounced text changes, so typing doesn't hit the API on every keystroke
  useEffect(() => {
    if (debouncedSearch !== values.keyword)
      onChange({ keyword: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const hasFilters =
    values.keyword ||
    values.category ||
    values.minPrice ||
    values.maxPrice ||
    values.sort !== "newest";

  const applyOnEnter = (e) => e.key === "Enter" && e.target.blur();

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <label htmlFor="search" className={labelClass}>
          Search
        </label>
        <input
          id="search"
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>
          Category
        </label>
        <select
          id="category"
          value={values.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className={inputClass}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>Price</span>
        <div className="flex items-center gap-2">
          {/* key= resets the field when the URL value changes (e.g. after "Clear") */}
          <input
            key={`min-${values.minPrice}`}
            type="number"
            min="0"
            placeholder="Min"
            aria-label="Minimum price"
            defaultValue={values.minPrice}
            onBlur={(e) =>
              e.target.value !== values.minPrice &&
              onChange({ minPrice: e.target.value })
            }
            onKeyDown={applyOnEnter}
            className={inputClass}
          />
          <span className="text-gray-400">to</span>
          <input
            key={`max-${values.maxPrice}`}
            type="number"
            min="0"
            placeholder="Max"
            aria-label="Maximum price"
            defaultValue={values.maxPrice}
            onBlur={(e) =>
              e.target.value !== values.maxPrice &&
              onChange({ maxPrice: e.target.value })
            }
            onKeyDown={applyOnEnter}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="sort" className={labelClass}>
          Sort by
        </label>
        <select
          id="sort"
          value={values.sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          className={inputClass}
        >
          {SORTS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={() => {
            setSearch("");
            onClear();
          }}
          className="w-full rounded-md border border-gray-300 py-2 text-sm hover:bg-gray-100"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
