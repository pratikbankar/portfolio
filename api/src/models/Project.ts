import { model, Schema } from 'mongoose';

const schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    subtitle: { type: String, default: '' },
    role: { type: String, default: '' },
    description: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    imageFileIds: { type: [String], default: [] },
    githubUrl: { type: String, default: '' },
    liveUrl: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export const Project = model('Project', schema);
