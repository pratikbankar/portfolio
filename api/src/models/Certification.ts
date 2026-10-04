import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    name: { type: String, required: true },
    issuer: { type: String, default: '' },
    status: { type: String, enum: ['completed', 'in-progress'], default: 'completed' },
    year: { type: String, default: '' },
    url: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export const Certification = model('Certification', schema);
