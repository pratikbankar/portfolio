import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: '' },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    // SHA-256 of the sender IP. The raw address is never stored.
    ipHash: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

export const ContactMessage = model('ContactMessage', schema);
