/** Describes each collection the admin panel manages, so one editor component serves them all. */

export type FieldType = 'text' | 'textarea' | 'list' | 'month' | 'url' | 'select' | 'boolean' | 'images';

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  /** For `select`. */
  options?: Array<{ value: string; label: string }>;
  /** For `month`: allows "no end date", stored as null. */
  nullable?: boolean;
  /** For `month` with `nullable`: the checkbox label. */
  nullLabel?: string;
}

export type Item = Record<string, unknown> & { _id: string };
export type Values = Record<string, unknown>;

export interface Resource {
  title: string;
  singular: string;
  /** Path under /api/admin. */
  endpoint: string;
  description: string;
  fields: Field[];
  primary: (item: Item) => string;
  secondary: (item: Item) => string;
}

const text = (name: string, label: string, extra: Partial<Field> = {}): Field => ({ name, label, type: 'text', ...extra });
const join = (...parts: unknown[]) => parts.filter(Boolean).join(' · ');
const range = (item: Item) => `${item.startDate} to ${item.endDate ?? 'Present'}`;

export const resources: Record<string, Resource> = {
  skills: {
    title: 'Skills',
    singular: 'skill',
    endpoint: '/admin/skills',
    description: 'Skills are grouped by category on the site. Drag to reorder.',
    fields: [
      text('name', 'Skill', { required: true, placeholder: 'React.js' }),
      text('category', 'Category', { required: true, placeholder: 'Frontend', help: 'Skills with the same category appear together.' }),
    ],
    primary: (i) => String(i.name),
    secondary: (i) => String(i.category),
  },
  experience: {
    title: 'Experience',
    singular: 'role',
    endpoint: '/admin/experiences',
    description: 'Work history, shown as a timeline. Put the most recent role first.',
    fields: [
      text('company', 'Company', { required: true }),
      text('role', 'Role', { required: true }),
      text('location', 'Location'),
      { name: 'startDate', label: 'Start', type: 'month', required: true },
      { name: 'endDate', label: 'End', type: 'month', nullable: true, nullLabel: 'I currently work here' },
      { name: 'responsibilities', label: 'Responsibilities', type: 'list', help: 'One per line.' },
      { name: 'achievements', label: 'Key achievements', type: 'list', help: 'One per line.' },
    ],
    primary: (i) => `${i.role}, ${i.company}`,
    secondary: (i) => join(range(i), i.location),
  },
  projects: {
    title: 'Projects',
    singular: 'project',
    endpoint: '/admin/projects',
    description: 'Each project gets a card on the home page and its own detail page.',
    fields: [
      text('title', 'Title', { required: true }),
      text('slug', 'URL name', { help: 'Used in the page address. Leave empty to create it from the title.', placeholder: 'my-project' }),
      text('subtitle', 'Subtitle'),
      text('role', 'Your role'),
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'highlights', label: 'Highlights', type: 'list', help: 'One per line. Shown on the project page.' },
      { name: 'technologies', label: 'Technologies', type: 'list', help: 'One per line.' },
      { name: 'imageFileIds', label: 'Screenshots', type: 'images', help: 'The first image is the card cover. JPEG, PNG, WebP or AVIF, up to 5 MB each.' },
      { name: 'githubUrl', label: 'GitHub link', type: 'url', placeholder: 'https://github.com/...' },
      { name: 'liveUrl', label: 'Live or demo link', type: 'url', placeholder: 'https://...' },
      { name: 'featured', label: 'Featured project', type: 'boolean' },
    ],
    primary: (i) => String(i.title),
    secondary: (i) => join(i.subtitle, `/projects/${i.slug}`),
  },
  education: {
    title: 'Education',
    singular: 'entry',
    endpoint: '/admin/education',
    description: 'Degrees and schooling.',
    fields: [
      text('degree', 'Degree', { required: true }),
      text('field', 'Field of study'),
      text('institution', 'Institution', { required: true }),
      text('location', 'Location'),
      { name: 'startDate', label: 'Start', type: 'month', required: true },
      { name: 'endDate', label: 'End', type: 'month', nullable: true, nullLabel: 'Still studying here' },
    ],
    primary: (i) => join(i.degree, i.field),
    secondary: (i) => join(i.institution, range(i)),
  },
  certifications: {
    title: 'Certifications',
    singular: 'certification',
    endpoint: '/admin/certifications',
    description: 'Certifications and training, completed or in progress.',
    fields: [
      text('name', 'Name', { required: true }),
      text('issuer', 'Issuer'),
      {
        name: 'status', label: 'Status', type: 'select',
        options: [{ value: 'completed', label: 'Completed' }, { value: 'in-progress', label: 'In progress' }],
      },
      text('year', 'Year', { placeholder: '2024', help: 'Four digits, or leave empty.' }),
      { name: 'url', label: 'Credential link', type: 'url', placeholder: 'https://...' },
    ],
    primary: (i) => String(i.name),
    secondary: (i) => join(i.issuer, i.status === 'completed' ? 'Completed' : 'In progress', i.year),
  },
  awards: {
    title: 'Awards',
    singular: 'award',
    endpoint: '/admin/awards',
    description: 'Awards and recognition.',
    fields: [
      text('title', 'Title', { required: true }),
      text('issuer', 'Given by'),
      { name: 'description', label: 'Description', type: 'textarea' },
      text('year', 'Year', { placeholder: '2024', help: 'Four digits, or leave empty.' }),
    ],
    primary: (i) => String(i.title),
    secondary: (i) => join(i.issuer, i.year),
  },
  'social-links': {
    title: 'Social links',
    singular: 'link',
    endpoint: '/admin/social-links',
    description: 'Shown in the hero, the contact section and the footer.',
    fields: [
      text('platform', 'Platform', { required: true, placeholder: 'LinkedIn' }),
      { name: 'url', label: 'Link', type: 'url', required: true, placeholder: 'https://... or mailto:you@example.com' },
    ],
    primary: (i) => String(i.platform),
    secondary: (i) => String(i.url),
  },
};

const blank = (field: Field): unknown => {
  if (field.type === 'boolean') return false;
  if (field.type === 'images') return [];
  if (field.type === 'month' && field.nullable) return null;
  if (field.type === 'select') return field.options?.[0]?.value ?? '';
  return '';
};

export function emptyValues(fields: Field[]): Values {
  return Object.fromEntries(fields.map((f) => [f.name, blank(f)]));
}

/** Stored item to form state. Lists become one item per line. */
export function toValues(fields: Field[], item: Record<string, unknown>): Values {
  return Object.fromEntries(
    fields.map((f) => {
      const value = item[f.name];
      if (f.type === 'list') return [f.name, Array.isArray(value) ? value.join('\n') : ''];
      return [f.name, value ?? blank(f)];
    }),
  );
}

/** Form state to request body. Only the declared fields are sent; the API rejects anything else. */
export function toPayload(fields: Field[], values: Values): Values {
  return Object.fromEntries(
    fields.map((f) => {
      const value = values[f.name];
      if (f.type === 'list') {
        return [f.name, String(value ?? '').split('\n').map((line) => line.trim()).filter(Boolean)];
      }
      if (f.type === 'month') return [f.name, value || (f.nullable ? null : '')];
      if (typeof value === 'string') return [f.name, value.trim()];
      return [f.name, value];
    }),
  );
}
