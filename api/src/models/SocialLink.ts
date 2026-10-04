import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export const SocialLink = model('SocialLink', schema);
