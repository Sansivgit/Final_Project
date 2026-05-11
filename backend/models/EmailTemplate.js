import mongoose from 'mongoose';

/** Transactional email bodies stored in DB; use {{resetUrl}}, {{userName}}, {{appName}} in templates. */
const emailTemplateSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    subject: { type: String, required: true, trim: true },
    htmlBody: { type: String, required: true },
    textBody: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

export default mongoose.model('EmailTemplate', emailTemplateSchema);
