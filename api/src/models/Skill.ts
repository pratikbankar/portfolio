import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export const Skill = model('Skill', schema);
