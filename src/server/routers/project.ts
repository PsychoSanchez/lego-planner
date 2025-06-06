import { router, publicProcedure } from '../trpc';
import { connectToDatabase } from '@/lib/mongodb';
import { ProjectModel, fromProjectDocument } from '@/lib/models/project';
import { type } from 'arktype';

// Input schemas using ArkType
const getProjectsInput = type({
  'search?': 'string',
  'type?': 'string',
  'quarter?': 'string < 7',
  'includeArchived?': 'boolean',
  'priorities?': 'string[]',
  'quarters?': 'string[]',
  'areas?': 'string[]',
  'leads?': 'string[]',
  'teams?': 'string[]',
  'dependencies?': 'string[]',
});

const createProjectInput = type({
  name: 'string < 255',
  slug: 'string < 32',
  type: 'string < 32',
  'quarter?': 'string < 7',
  'color?': 'string < 32',
  'description?': 'string < 2000',
  'priority?': "'low' | 'medium' | 'high' | 'urgent'",
  'teamId?': 'string < 100',
  'leadId?': 'string < 100',
  'area?': 'string < 100',
  'dependencies?': type({
    team: 'string',
    'status?': "'pending' | 'submitted' | 'approved' | 'rejected'",
    'description?': 'string',
  }).array(),
  'cost?': 'number | string',
  'impact?': 'number | string',
  'estimates?': type({
    department: 'string',
    value: 'number',
  }).array(),
});

const updateProjectInput = type({
  id: 'string',
  name: 'string < 255',
  slug: 'string < 32',
  type: 'string < 32',
  'quarter?': 'string < 7',
  'color?': 'string < 32',
  'description?': 'string < 2000',
  'priority?': "'low' | 'medium' | 'high' | 'urgent'",
  'teamId?': 'string < 100',
  'leadId?': 'string < 100',
  'area?': 'string < 100',
  'archived?': 'boolean',
});

const patchProjectInput = type({
  id: 'string',
  'name?': 'string < 255',
  'slug?': 'string < 32',
  'type?': 'string < 32',
  'color?': 'string < 32',
  'quarter?': 'string < 7',
  'description?': 'string < 2000',
  'priority?': "'low' | 'medium' | 'high' | 'urgent'",
  'teamIds?': 'string[]',
  'leadId?': 'string < 100',
  'area?': 'string < 100',
  'quarters?': 'string[]',
  'archived?': 'boolean',
  'dependencies?': type({
    team: 'string',
    'status?': "'pending' | 'submitted' | 'approved' | 'rejected'",
    'description?': 'string',
  }).array(),
  'cost?': 'number',
  'impact?': 'number',
  'estimates?': type({
    department: 'string',
    value: 'number',
  }).array(),
});

const getProjectByIdInput = type({
  id: 'string',
});

const deleteProjectInput = type({
  id: 'string',
});

export const projectRouter = router({
  // Get all projects with filtering
  getProjects: publicProcedure.input(getProjectsInput).query(async ({ input }) => {
    await connectToDatabase();

    const {
      search,
      type: projectType,
      quarter,
      includeArchived = false,
      priorities = [],
      quarters = [],
      areas = [],
      leads = [],
      teams = [],
      dependencies = [],
    } = input;

    const query: Record<string, unknown> = {};

    // By default, only show non-archived projects unless specifically requested
    if (!includeArchived) {
      query.archived = { $ne: true };
    }

    if (projectType && projectType !== 'all') {
      query.type = projectType;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Legacy single quarter filter (for backward compatibility)
    if (quarter) {
      // Use quarters array field instead of old quarter field
      query.quarters = { $in: [quarter] };
    }

    // New multidimensional filters using $in operator for OR logic within each dimension
    if (priorities.length > 0) {
      query.priority = { $in: priorities };
    }

    if (quarters.length > 0) {
      // If both legacy quarter and new quarters are provided, use the new one
      if (!quarter) {
        // Use $in to match projects that have at least one quarter in the filter
        query.quarters = { $in: quarters };
      }
    }

    if (areas.length > 0) {
      query.area = { $in: areas };
    }

    if (leads.length > 0) {
      query.leadId = { $in: leads };
    }

    if (teams.length > 0) {
      // Use $in to match projects that have at least one team in the filter
      query.teamIds = { $in: teams };
    }

    if (dependencies.length > 0) {
      // Use $in to match projects that have at least one dependency team in the filter
      query['dependencies.team'] = { $in: dependencies };
    }

    const projectDocs = await ProjectModel.find(query).sort({ createdAt: -1 });
    const projects = projectDocs.map(fromProjectDocument);

    return { projects };
  }),

  // Get a single project by ID
  getProjectById: publicProcedure.input(getProjectByIdInput).query(async ({ input }) => {
    await connectToDatabase();

    const project = await ProjectModel.findById(input.id);

    if (!project) {
      throw new Error('Project not found');
    }

    return fromProjectDocument(project);
  }),

  // Create a new project
  createProject: publicProcedure.input(createProjectInput).mutation(async ({ input }) => {
    await connectToDatabase();

    const newProject = await ProjectModel.create(input);
    return fromProjectDocument(newProject);
  }),

  // Update a project (full update)
  updateProject: publicProcedure.input(updateProjectInput).mutation(async ({ input }) => {
    await connectToDatabase();

    const { id, ...updateData } = input;

    const updatedProject = await ProjectModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedProject) {
      throw new Error('Project not found');
    }

    return fromProjectDocument(updatedProject);
  }),

  // Patch a project (partial update)
  patchProject: publicProcedure.input(patchProjectInput).mutation(async ({ input }) => {
    await connectToDatabase();

    const { id, ...updateData } = input;

    const updatedProject = await ProjectModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedProject) {
      throw new Error('Project not found');
    }

    return fromProjectDocument(updatedProject);
  }),

  // Delete a project
  deleteProject: publicProcedure.input(deleteProjectInput).mutation(async ({ input }) => {
    await connectToDatabase();

    const deletedProject = await ProjectModel.findByIdAndDelete(input.id);

    if (!deletedProject) {
      throw new Error('Project not found');
    }

    return { message: 'Project deleted successfully' };
  }),
});
