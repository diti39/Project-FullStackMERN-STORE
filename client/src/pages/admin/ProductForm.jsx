import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getProduct,
  getCategories,
  createProduct,
  updateProduct,
} from "../../api/products";
import { deleteUploadedImage } from "../../api/uploads";
import { getErrorMessage } from "../../api/axios";
import FormInput from "../../components/common/FormInput";
import ErrorMessage from "../../components/common/ErrorMessage";
import Loader from "../../components/common/Loader";
import ImageUploader from "../../components/admin/ImageUploader";

const EMPTY = {
  name: "",
  description: "",
  price: "",
  category: "",
  brand: "",
  countInStock: "",
  isFeatured: false,
};

// Same form for creating (/admin/products/new) and editing (/admin/products/:id/edit)
export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]); // [{ url, publicId? }]
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Images uploaded during this visit, and whether the product was saved.
  // If the admin leaves without saving, those uploads are deleted so they don't pile up in Cloudinary.
  const sessionUploads = useRef(new Set());
  const saved = useRef(false);

  useEffect(() => {
    const uploads = sessionUploads.current;
    return () => {
      if (!saved.current) {
        uploads.forEach((publicId) =>
          deleteUploadedImage(publicId).catch(() => {}),
        );
      }
    };
  }, []);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    getProduct(id)
      .then((p) => {
        if (cancelled) return;
        setForm({
          name: p.name,
          description: p.description,
          price: String(p.price),
          category: p.category,
          brand: p.brand || "",
          countInStock: String(p.countInStock),
          isFeatured: p.isFeatured,
        });
        setImages(p.images || []);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      brand: form.brand.trim(),
      countInStock: Number(form.countInStock),
      isFeatured: form.isFeatured,
      images: images.map(({ url, publicId }) => ({ url, publicId })),
    };

    try {
      if (isEdit) await updateProduct(id, payload);
      else await createProduct(payload);
      saved.current = true; // keeps the unmount cleanup from deleting the images we just saved
      navigate("/admin/products");
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/admin/products"
        className="text-sm text-indigo-600 hover:underline"
      >
        &larr; Back to products
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">
        {isEdit ? "Edit product" : "Add product"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <ErrorMessage>{error}</ErrorMessage>

        <FormInput
          label="Name"
          id="name"
          name="name"
          required
          value={form.name}
          onChange={handleChange}
        />

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            value={form.description}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Price ($)"
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={handleChange}
          />
          <FormInput
            label="Stock"
            id="countInStock"
            name="countInStock"
            type="number"
            min="0"
            step="1"
            required
            value={form.countInStock}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormInput
              label="Category"
              id="category"
              name="category"
              required
              list="category-options"
              value={form.category}
              onChange={handleChange}
            />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <FormInput
            label="Brand"
            id="brand"
            name="brand"
            value={form.brand}
            onChange={handleChange}
          />
        </div>

        <ImageUploader
          images={images}
          onChange={setImages}
          sessionUploads={sessionUploads}
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            checked={form.isFeatured}
            onChange={handleChange}
          />
          Show on the home page as a featured product
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
          </button>
          <Link
            to="/admin/products"
            className="rounded-md border border-gray-300 px-5 py-2 text-sm hover:bg-gray-100"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
