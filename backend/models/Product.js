import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    clothType: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0 },
    sizes: [{ type: String, trim: true }],
    colors: [colorSchema],
    image: { type: String, default: '' },
  },
  { timestamps: true },
);

/** Legacy docs may store color names as plain strings — coerce before validation */
productSchema.pre('validate', function coerceLegacyColors(next) {
  if (!Array.isArray(this.colors)) return next();
  this.colors = this.colors.map((c) => {
    if (typeof c === 'string') {
      return { name: c.trim() || 'Color', hex: '#888888' };
    }
    if (c && typeof c === 'object') {
      return {
        name: String(c.name || 'Color').trim(),
        hex: String(c.hex || '#888888').trim(),
      };
    }
    return { name: 'Color', hex: '#888888' };
  });
  next();
});

productSchema.index({ title: 'text', category: 'text', brand: 'text', clothType: 'text' });

export default mongoose.model('Product', productSchema);
