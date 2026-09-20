import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, index: true },
    brand: { type: String, trim: true },
    images: [
      {
        url: { type: String, required: true },
        publicId: String, // Cloudinary id, needed for deletion
      },
    ],
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    isFeatured: { type: Boolean, default: false },

    // Cached from the Review collection
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Enables ?keyword= search across name and description
productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Product', productSchema);