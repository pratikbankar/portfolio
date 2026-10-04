import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    title: { type: String, required: true },
    issuer: { type: String, default: '' },
    description: { type: String, default: '' },
    year: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export const Award = model('Award', schema);
