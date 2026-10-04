import { model, Schema } from 'mongoose';

const text = { type: String, default: '' };

const schema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    name: text,
    jobTitle: text,
    tagline: text,
    summary: text,
    about: text,
    location: text,
    email: text,
    photoFileId: text,
    resumeFileId: text,
    seoTitle: text,
    seoDescription: text,
    gaMeasurementId: text,
  },
  { timestamps: true, versionKey: false },
);

export const Profile = model('Profile', schema);
