import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { fromProjectDocument, ProjectModel } from '@/lib/models/project';
import { Project } from '@/lib/types';
import { ProjectView } from '@/app/projects/[id]/_components/project-view';
import { TeamOption } from '@/components/team-selector';
import { fromTeamMemberDocument, TeamMemberModel } from '@/lib/models/team-member';

// Get project data
async function getProjectData(id: string): Promise<Project | null> {
  try {
    await connectToDatabase();
    const project = await ProjectModel.findById(id);
    if (!project) return null;

    return fromProjectDocument(project);
  } catch (error) {
    console.error('Error fetching project data:', error);

    return null;
  }
}

async function getTeams(): Promise<TeamOption[]> {
  await connectToDatabase();
  const teams = await TeamMemberModel.find();

  return teams.map(fromTeamMemberDocument).map((team) => ({
    id: team.id,
    name: team.name,
    role: team.role || 'other',
    type: team.type as 'person' | 'team' | 'dependency' | 'event',
  }));
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const project = await getProjectData((await params).id);

  if (!project) {
    notFound();
  }

  const teams = await getTeams();

  return (
    <div className="max-w-5xl mx-auto w-full">
      <ProjectView project={project} teams={teams} teamsLoading={false} />
    </div>
  );
}
