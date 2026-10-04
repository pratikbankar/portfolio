import { model, Schema } from 'mongoose';

const on = { type: Boolean, default: true };

const schema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    about: on,
    skills: on,
    experience: on,
    projects: on,
    education: on,
    certifications: on,
    awards: on,
    resume: on,
    contact: on,
  },
  { timestamps: true, versionKey: false },
);

export const SectionSettings = model('SectionSettings', schema);
