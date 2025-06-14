import { type } from 'arktype';

export type Role =
  | 'engineering'
  | 'design'
  | 'qa'
  | 'analytics'
  | 'data_science'
  | 'product_management' // Added based on common team structures
  | 'operations' // Added based on user requirements
  | 'other'; // For flexibility

export interface Assignee {
  id: string;
  name: string;
  type: 'person' | 'team' | 'dependency' | 'event';
  role?: Role; // Added role field
}

export interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  type:
    | 'regular'
    | 'tech-debt'
    | 'team-event'
    | 'spillover'
    | 'blocked'
    | 'hack'
    | 'sick-leave'
    | 'vacation'
    | 'onboarding'
    | 'duty'
    | 'risky-week';
  color?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  teamIds?: string[];
  leadId?: string;
  area?: string;
  quarters?: string[];
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  dependencies?: Array<{
    team: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    description: string;
  }>;
  roi?: number;
  impact?: number;
  cost?: number;
  estimates?: Array<{
    department: string; // engineering, design, product, ds, analytics, etc.
    value: number;
  }>;
}

export const setAssignmentSchema = type({
  year: '1970 <= number.integer <= 2100',
  week: '0 <= number.integer <= 52',
  assigneeId: 'string',
  quarter: '0 < number <= 5',
  projectId: 'string | null',
  'status?': 'string | undefined',
});

export type SetAssignment = typeof setAssignmentSchema.infer;

export interface Assignment {
  id: string;
  plannerId: string;
  assigneeId: string;
  projectId: string;
  week: number;
  year: number;
  quarter: number;
  status?: string;
}

export interface PlannerData {
  assignees: Assignee[];
  projects: Project[];
  assignments: Assignment[];
}

export interface Planner {
  id: string;
  name: string;
  assignees: Assignee[];
  projects: Project[];
}

export interface PlannerCreateData {
  name?: string;
  assignees: string[];
  projects: string[];
  assignments: string[];
}
