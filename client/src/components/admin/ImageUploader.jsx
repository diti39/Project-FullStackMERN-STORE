import { useRef, useState } from "react";
import { uploadImages, deleteUploadedImage } from "../../api/uploads";
import { getErrorMessage } from "../../api/axios";
import ErrorMessage from "../common/ErrorMessage";

const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

// Controlled component: the parent owns `images` ([{ url, publicId? }]) and receives changes via onChange.
// `sessionUploads` is a ref holding a Set of publicIds uploaded during this form session,
// so the parent can clean up if the form is abandoned.
export default function ImageUploader({ images, onChange, sessionUploads }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = ""; // lets the admin pick the same file again later
    if (files.length === 0) return;
    setError("");

    // Quick checks so people get instant feedback (the server checks again)
    if (images.length + files.length > MAX_IMAGES) {
      setError(`A product can have at most ${MAX_IMAGES} images`);
      return;
    }
    if (files.some((f) => !ACCEPTED.includes(f.type))) {
      setError("Only JPG, PNG or WebP images are allowed");
      return;
    }
    if (files.some((f) => f.size > MAX_SIZE)) {
      setError("Each image must be 5 MB or smaller");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadImages(files);
      uploaded.forEach((img) => sessionUploads.current.add(img.publicId));
      onChange([...images, ...uploaded]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    const img = images[index];
    // Uploaded during this session and never saved: delete it from Cloudinary right away.
    // Images already saved on the product are only removed from the list here;
    // the server deletes them from Cloudinary when the product is saved.
    if (img.publicId && sessionUploads.current.has(img.publicId)) {
      sessionUploads.current.delete(img.publicId);
      deleteUploadedImage(img.publicId).catch(() => {});
    }
    onChange(images.filter((_, i) => i !== index));
  };

  const makeMain = (index) =>
    onChange([images[index], ...images.filter((_, i) => i !== index)]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Images</span>
        <span className="text-xs text-gray-500">
          {images.length} / {MAX_IMAGES}
        </span>
      </div>

      <ErrorMessage>{error}</ErrorMessage>

      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, i) => (
          <li
            key={img.publicId || img.url}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <div className="relative aspect-4/3 bg-gray-100">
              <img
                src={img.url}
                alt={`Product image ${i + 1}`}
                className="h-full w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                  Main
                </span>
              )}
            </div>
            <div className="flex justify-between px-2 py-1.5 text-xs">
              {i === 0 ? (
                <span className="text-gray-400">Main image</span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeMain(i)}
                  disabled={uploading}
                  className="text-indigo-600 hover:underline disabled:opacity-50"
                >
                  Make main
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                disabled={uploading}
                className="text-red-600 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </li>
        ))}

        {uploading && (
          <li className="flex aspect-4/3 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500">
            Uploading...
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFiles}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || images.length >= MAX_IMAGES}
        className="mt-3 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Add images"}
      </button>
      <p className="mt-1 text-xs text-gray-500">
        JPG, PNG or WebP, up to 5 MB each. The first image is the main one.
      </p>
    </div>
  );
}
