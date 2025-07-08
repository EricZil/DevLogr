export interface ProjectData {
  id: string;
  name: string;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  progress: number;
  visibility: string;
  icon: string | null;
  color: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  allowIssues: boolean;
  allowFeedback: boolean;
  createdAt: string;
  updatedAt: string;
  lastUpdate: string;
  customDomain?: string | null;
  domainVerified?: boolean;
  sslEnabled?: boolean;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
  updates: Array<Update>;
  milestones: Array<Milestone>;
  issues: Array<Issue>;
  feedback: Array<Feedback>;
  _count: {
    updates: number;
    milestones: number;
    issues: number;
    feedback: number;
  };
}

export interface Update {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  projectId: string;
  project?: {
    title: string;
  };
  images?: { url: string }[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  tasks: Array<Task>;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours: number | null;
  actualHours: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  subtasks: Array<Subtask>;
  _count: {
    comments: number;
    timeEntries: number;
  };
  milestone?: {
    id: string;
    title: string;
  };
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

export interface Issue {
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'CLOSED' | 'IN_PROGRESS';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reporterName: string;
    createdAt: string;
    updatedAt: string;
    _count?: { comments: number };
}

export interface Feedback {
  id: string;
  message: string;
  rating: number;
  category: string;
  submitterName: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    username: string;
    avatar?: string;
  }
}

