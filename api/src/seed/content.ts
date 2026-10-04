// Initial site content, taken from Pratik Bankar's resume.
// Phone number and date of birth are deliberately left out: they must never be published.

export const profile = {
  name: 'Pratik Bankar',
  jobTitle: 'Senior Full Stack Engineer',
  tagline: 'I build scalable web applications and enterprise SaaS platforms with React, Node.js and AWS.',
  summary:
    'Senior Full Stack Engineer with around 10 years of experience in web development, including 5.5+ years building scalable web applications and enterprise SaaS platforms using React.js, Node.js, AWS, and GCP.',
  about:
    'I am a Senior Full Stack Engineer with around 10 years of experience in software web development, including 5.5+ years of hands-on experience building scalable web applications and enterprise SaaS platforms using React.js, Node.js, AWS, and GCP.\n\n' +
    'My strengths are frontend architecture, backend APIs, performance optimization, cloud-native development, and AI-assisted engineering workflows.\n\n' +
    'I have delivered high-performance applications across SEO and digital growth platforms, Insurance, E-commerce, and Travel, working through the full software development lifecycle with Agile teams.',
  location: 'Pune, Maharashtra, India',
  email: 'pratikbankar88@gmail.com',
  seoTitle: 'Pratik Bankar | Senior Full Stack Engineer',
  seoDescription:
    'Portfolio of Pratik Bankar, a Senior Full Stack Engineer in Pune, India, building scalable React, Node.js and AWS applications for enterprise SaaS platforms.',
};

export const skills: Record<string, string[]> = {
  Frontend: [
    'React.js', 'Next.js', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3',
    'Responsive Web Design', 'Reusable UI Components',
  ],
  Backend: [
    'Node.js', 'Express.js', 'REST APIs', 'PHP', 'CodeIgniter',
    'API Design/Integration', 'Serverless Architecture',
  ],
  'Cloud & DevOps': [
    'AWS Lambda', 'API Gateway', 'CloudFront', 'S3', 'EC2', 'Step Functions', 'AWS Batch',
    'CloudWatch', 'GCP', 'Docker', 'Airflow', 'CI/CD', 'GitHub Actions',
  ],
  'Databases & Caching': ['PostgreSQL', 'MySQL', 'Snowflake', 'Redis', 'DynamoDB'],
  'Testing & Performance': [
    'Jest', 'Lighthouse', 'Core Web Vitals', 'Web Performance Optimization', 'SSR/CSR Architecture',
  ],
  'AI & Developer Tools': [
    'ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Cursor AI', 'Codex', 'OpenAI API', 'Prompt Engineering',
  ],
  'Tools & Platforms': ['GitHub', 'Jira', 'Postman', 'VS Code', 'Figma', 'Looker', 'WordPress', 'CLI/Terminal'],
};

export const experiences = [
  {
    company: 'LTIMindtree',
    role: 'Senior Product Engineer',
    location: 'Pune, India',
    startDate: '2021-09',
    endDate: null,
    responsibilities: [
      'Built scalable React.js, React Native, and Node.js applications for enterprise SEO platforms.',
      'Developed REST APIs, Redis caching, and AWS serverless solutions with performance optimization.',
      'Integrated AI-powered SEO workflows using GPT, semantic analysis, and GSC data.',
    ],
    achievements: [
      'Received 2 Hi-Five Awards for ownership, accuracy, speed, and contribution to project deliverables.',
      'Received the Super Crew Award for client appreciation, teamwork, and continuous delivery without escalations.',
    ],
  },
  {
    company: 'Cuelogic Technologies',
    role: 'Senior Software Engineer',
    location: 'Pune, India',
    startDate: '2021-03',
    endDate: '2021-09',
    responsibilities: [
      'Built scalable applications using React.js, Node.js, and AWS.',
      'Developed reusable UI, APIs, and CI/CD workflows.',
      'Improved performance through Agile development and code reviews.',
    ],
  },
  {
    company: 'Policy Planner Web Agg Pvt. Ltd',
    role: 'Senior Software Developer',
    location: 'Pune, India',
    startDate: '2019-02',
    endDate: '2021-03',
    responsibilities: [
      'Built insurance applications using Angular, PHP, CodeIgniter, and MySQL.',
      'Developed responsive UI, REST APIs, and payment integrations.',
      'Led the integration of payment gateways, reporting systems, and secure RESTful APIs for seamless transactions.',
      'Optimized database and backend performance.',
    ],
  },
  {
    company: 'Pocket InfoTech',
    role: 'Software Developer',
    location: 'Pune, India',
    startDate: '2015-10',
    endDate: '2019-01',
    responsibilities: [
      'Built web applications for E-commerce, Travel, and Digital Marketing.',
      'Optimized MySQL/PostgreSQL and integrated third-party APIs.',
      'Developed frontend UI and WordPress plugins.',
    ],
  },
];

export const projects = [
  {
    title: 'Quattr',
    subtitle: 'Enterprise SEO & Content Optimization Platform',
    role: 'Senior Product Engineer',
    description:
      'An enterprise SEO and content optimization platform built for intelligent internal linking and automation, with AI-driven analysis of search and content data.',
    highlights: [
      'Developed scalable SEO and content optimization platforms tailored for intelligent internal linking and automation.',
      'Implemented AWS Lambda for serverless functions, AWS Batch for scheduled tasks, and CloudFront for hosting SDKs, improving global content delivery efficiency.',
      'Built and managed multiple end-to-end modules, including authentication, data processing workflows, API integrations, and analytics dashboards.',
      'Integrated AI-driven features utilizing GPT models to analyze Google Search Console data and content for organic traffic growth.',
    ],
    technologies: [
      'React.js', 'Next.js', 'Node.js', 'Express', 'JavaScript', 'TypeScript', 'AWS Lambda', 'AWS Batch',
      'CloudFront', 'S3', 'GCP', 'Redis', 'PostgreSQL', 'Snowflake', 'Looker', 'Docker',
    ],
    featured: true,
  },
];

export const education = [
  {
    degree: 'Bachelor of Technology (B.Tech)',
    field: 'Computer Science & Technology',
    institution: 'Department of Technology',
    location: 'Kolhapur, Maharashtra, India',
    startDate: '2011-07',
    endDate: '2014-07',
  },
  {
    degree: 'Diploma',
    field: 'Computer Technology',
    institution: 'Sinhgad Institute of Technology and Science',
    location: 'Pune, Maharashtra, India',
    startDate: '2008-07',
    endDate: '2011-07',
  },
  {
    degree: 'Secondary School Certificate (S.S.C)',
    institution: 'K.J. Somaiya High School',
    location: 'Shrirampur, Maharashtra, India',
    startDate: '2007-07',
    endDate: '2008-07',
  },
];

export const certifications = [
  { name: 'Node.js & React.js Training', issuer: 'Internal Company Training', status: 'completed' },
  { name: 'AWS Certification', issuer: 'Amazon Web Services', status: 'in-progress' },
  { name: 'GitHub Copilot', issuer: 'GitHub', status: 'in-progress' },
  { name: 'Angular: The Complete Guide (2020 Edition)', issuer: 'Udemy', status: 'completed' },
];

export const awards = [
  {
    title: 'Hi-Five Award',
    issuer: 'LTIMindtree',
    description: 'Received 2 Hi-Five Awards for ownership, accuracy, speed, and contribution to project deliverables.',
  },
  {
    title: 'Super Crew Award',
    issuer: 'LTIMindtree',
    description: 'Received for client appreciation, exceptional teamwork, and continuous delivery without escalations.',
  },
];

export const socialLinks = [
  { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/pratik-bankar-4884b782' },
  { platform: 'GitHub', url: 'https://github.com/pratikbankar' },
  { platform: 'Email', url: 'mailto:pratikbankar88@gmail.com' },
];
