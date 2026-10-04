import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    content: { type: Schema.Types.Mixed, required: true },
    publishedAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);

export const PublishedSnapshot = model('PublishedSnapshot', schema);
