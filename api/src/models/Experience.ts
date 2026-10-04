import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    location: { type: String, default: '' },
    // 'YYYY-MM'; a null endDate means the role is current.
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    responsibilities: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export const Experience = model('Experience', schema);
