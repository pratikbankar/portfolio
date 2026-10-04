import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    degree: { type: String, required: true },
    field: { type: String, default: '' },
    institution: { type: String, required: true },
    location: { type: String, default: '' },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export const Education = model('Education', schema);
