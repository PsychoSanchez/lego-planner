'use client';

import { useEffect } from 'react';
import { parseAsString, parseAsBoolean, parseAsArrayOf, useQueryState } from 'nuqs';
import { SearchProjects } from '@/app/projects/_components/search-projects';
import { GroupedProjectsTable } from '@/app/projects/_components/grouped-projects-table';
import { groupProjects } from '@/lib/utils/group-projects';
import { GroupByOption } from '@/app/projects/_components/project-group-selector';
import { SortByOption, SortDirectionOption } from '@/app/projects/_components/project-sort-selector';
import { TeamOption } from '@/components/team-selector';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { useOptimisticProjects } from '@/hooks/use-optimistic-projects';
import { useColumnVisibility, ColumnDefinition } from '@/hooks/use-column-visibility';
import { ProjectsGrid } from '@/app/projects/_components/projects-grid';
import { useViewMode } from '@/app/projects/_components/view-toggle';

const EMPTY_ARRAY = [] as string[];

// Define the available columns for the projects table
const PROJECT_COLUMNS: ColumnDefinition[] = [
  { id: 'name', label: 'Name', defaultVisible: true },
  { id: 'type', label: 'Type', defaultVisible: true },
  { id: 'priority', label: 'Priority', defaultVisible: true },
  { id: 'quarter', label: 'Quarter', defaultVisible: true },
  { id: 'team', label: 'Team', defaultVisible: true },
  { id: 'lead', label: 'Lead', defaultVisible: true },
  { id: 'dependencies', label: 'Dependencies', defaultVisible: false },
  { id: 'area', label: 'Area', defaultVisible: true },
  { id: 'cost', label: 'Cost', defaultVisible: false },
  { id: 'impact', label: 'Impact', defaultVisible: true },
  { id: 'roi', label: 'ROI', defaultVisible: false },
];

// Skeleton component for card loading state
function ProjectsCardSkeleton({ isGrouped }: { isGrouped: boolean }) {
  const skeletonCards = Array.from({ length: 8 }, (_, i) => i);

  const renderSkeletonCard = () => (
    <div className="group relative border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden h-32">
      {/* Gradient background placeholder */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-muted to-transparent" />

      {/* Content */}
      <div className="relative h-full p-2 flex flex-col">
        {/* Header with area icon and title */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Skeleton className="h-3.5 w-3.5 rounded flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-2.5 w-2.5 rounded flex-shrink-0" />
          </div>
        </div>

        {/* Project type and priority badges */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>

        {/* Bottom section with metadata */}
        <div className="mt-auto space-y-0.5">
          {/* Timeline and Area */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-2.5 rounded flex-shrink-0" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>

          {/* Team and Lead */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-2.5 w-2.5 rounded flex-shrink-0" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-2.5 w-2.5 rounded flex-shrink-0" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Business impact */}
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );

  if (isGrouped) {
    return (
      <div className="space-y-6">
        {/* Group 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
          <div className="pl-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {skeletonCards.slice(0, 4).map((index) => (
                <div key={`group1-${index}`}>{renderSkeletonCard()}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Group 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-14 ml-auto" />
          </div>
          <div className="pl-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {skeletonCards.slice(0, 3).map((index) => (
                <div key={`group2-${index}`}>{renderSkeletonCard()}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-grouped skeleton
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {skeletonCards.map((index) => (
        <div key={index}>{renderSkeletonCard()}</div>
      ))}
    </div>
  );
}

// Skeleton component for loading state
function ProjectsTableSkeleton({
  isGrouped,
  isColumnVisible,
}: {
  isGrouped: boolean;
  isColumnVisible: (columnId: string) => boolean;
}) {
  const skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  const renderSkeletonCells = () => {
    const cells = [];
    if (isColumnVisible('name')) {
      cells.push(
        <TableCell key="name" className="py-2 px-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
        </TableCell>,
      );
    }
    if (isColumnVisible('type')) {
      cells.push(
        <TableCell key="type" className="py-2 px-2">
          <Skeleton className="h-5 w-16 rounded-full" />
        </TableCell>,
      );
    }
    if (isColumnVisible('priority')) {
      cells.push(
        <TableCell key="priority" className="py-2 px-2">
          <Skeleton className="h-4 w-12" />
        </TableCell>,
      );
    }
    if (isColumnVisible('quarter')) {
      cells.push(
        <TableCell key="quarter" className="py-2 px-2">
          <Skeleton className="h-4 w-16" />
        </TableCell>,
      );
    }
    if (isColumnVisible('team')) {
      cells.push(
        <TableCell key="team" className="py-2 px-2">
          <Skeleton className="h-4 w-20" />
        </TableCell>,
      );
    }
    if (isColumnVisible('lead')) {
      cells.push(
        <TableCell key="lead" className="py-2 px-2">
          <Skeleton className="h-4 w-16" />
        </TableCell>,
      );
    }
    if (isColumnVisible('dependencies')) {
      cells.push(
        <TableCell key="dependencies" className="py-2 px-2">
          <Skeleton className="h-4 w-8" />
        </TableCell>,
      );
    }
    if (isColumnVisible('area')) {
      cells.push(
        <TableCell key="area" className="py-2 px-2">
          <Skeleton className="h-4 w-24" />
        </TableCell>,
      );
    }
    if (isColumnVisible('cost')) {
      cells.push(
        <TableCell key="cost" className="py-2 px-2">
          <Skeleton className="h-4 w-16" />
        </TableCell>,
      );
    }
    if (isColumnVisible('roi')) {
      cells.push(
        <TableCell key="roi" className="py-2 px-2">
          <Skeleton className="h-4 w-12" />
        </TableCell>,
      );
    }
    if (isColumnVisible('impact')) {
      cells.push(
        <TableCell key="impact" className="py-2 px-2">
          <Skeleton className="h-4 w-20" />
        </TableCell>,
      );
    }
    return cells;
  };

  const renderSkeletonHeader = () => {
    const headers = [];
    if (isColumnVisible('name'))
      headers.push(
        <TableHead key="name" className="min-w-[200px]">
          Name
        </TableHead>,
      );
    if (isColumnVisible('type'))
      headers.push(
        <TableHead key="type" className="w-[100px]">
          Type
        </TableHead>,
      );
    if (isColumnVisible('priority'))
      headers.push(
        <TableHead key="priority" className="w-[100px]">
          Priority
        </TableHead>,
      );
    if (isColumnVisible('quarter'))
      headers.push(
        <TableHead key="quarter" className="w-[150px]">
          Quarter
        </TableHead>,
      );
    if (isColumnVisible('team'))
      headers.push(
        <TableHead key="team" className="w-[150px]">
          Team
        </TableHead>,
      );
    if (isColumnVisible('lead'))
      headers.push(
        <TableHead key="lead" className="w-[100px]">
          Lead
        </TableHead>,
      );
    if (isColumnVisible('dependencies'))
      headers.push(
        <TableHead key="dependencies" className="w-[100px]">
          Dependencies
        </TableHead>,
      );
    if (isColumnVisible('area'))
      headers.push(
        <TableHead key="area" className="w-[200px]">
          Area
        </TableHead>,
      );
    if (isColumnVisible('cost'))
      headers.push(
        <TableHead key="cost" className="w-[100px]">
          Cost
        </TableHead>,
      );
    if (isColumnVisible('roi'))
      headers.push(
        <TableHead key="roi" className="w-[80px]">
          ROI
        </TableHead>,
      );
    if (isColumnVisible('impact'))
      headers.push(
        <TableHead key="impact" className="w-[120px]">
          Impact
        </TableHead>,
      );
    return headers;
  };

  if (isGrouped) {
    return (
      <div className="space-y-4">
        {/* Group 1 */}
        <div className="rounded-sm border">
          <div className="flex items-center gap-2 p-3 bg-muted/50">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16 ml-2" />
          </div>
          <Table className="text-xs">
            <TableHeader>
              <TableRow>{renderSkeletonHeader()}</TableRow>
            </TableHeader>
            <TableBody>
              {skeletonRows.slice(0, 4).map((index) => (
                <TableRow key={`group1-${index}`}>{renderSkeletonCells()}</TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Group 2 */}
        <div className="rounded-sm border">
          <div className="flex items-center gap-2 p-3 bg-muted/50">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-14 ml-2" />
          </div>
          <Table className="text-xs">
            <TableHeader>
              <TableRow>{renderSkeletonHeader()}</TableRow>
            </TableHeader>
            <TableBody>
              {skeletonRows.slice(0, 3).map((index) => (
                <TableRow key={`group2-${index}`}>{renderSkeletonCells()}</TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Non-grouped skeleton
  return (
    <div className="rounded-sm border">
      <Table className="text-xs">
        <TableHeader>
          <TableRow>{renderSkeletonHeader()}</TableRow>
        </TableHeader>
        <TableBody>
          {skeletonRows.map((index) => (
            <TableRow key={index}>{renderSkeletonCells()}</TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProjectsPageContent() {
  // View mode
  const viewMode = useViewMode();

  // Basic filters
  const [search] = useQueryState('search', parseAsString.withDefault(''));
  const [type] = useQueryState('type', parseAsString.withDefault('all'));
  const [includeArchived] = useQueryState('includeArchived', parseAsBoolean.withDefault(false));

  // View controls
  const [groupBy] = useQueryState('groupBy', parseAsString.withDefault('none'));
  const [sortBy] = useQueryState('sortBy', parseAsString.withDefault('name'));
  const [sortDirection] = useQueryState('sortDirection', parseAsString.withDefault('asc'));

  // Advanced multidimensional filters
  const [priorities] = useQueryState('priorities', parseAsArrayOf(parseAsString).withDefault(EMPTY_ARRAY));
  const [quarters] = useQueryState('quarters', parseAsArrayOf(parseAsString).withDefault(EMPTY_ARRAY));
  const [areas] = useQueryState('areas', parseAsArrayOf(parseAsString).withDefault(EMPTY_ARRAY));
  const [leads] = useQueryState('leads', parseAsArrayOf(parseAsString).withDefault(EMPTY_ARRAY));
  const [teamFilters] = useQueryState('teams', parseAsArrayOf(parseAsString).withDefault(EMPTY_ARRAY));
  const [dependencies] = useQueryState('dependencies', parseAsArrayOf(parseAsString).withDefault(EMPTY_ARRAY));

  // Column visibility
  const { isColumnVisible, toggleColumn, resetToDefaults } = useColumnVisibility({
    storageKey: 'projects-table-columns',
    columns: PROJECT_COLUMNS,
  });

  // Use the optimistic projects hook
  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
    updateProject: handleUpdateProject,
  } = useOptimisticProjects({
    search: search || undefined,
    type,
    includeArchived,
    priorities: priorities.length > 0 ? priorities : undefined,
    quarters: quarters.length > 0 ? quarters : undefined,
    areas: areas.length > 0 ? areas : undefined,
    leads: leads.length > 0 ? leads : undefined,
    teams: teamFilters.length > 0 ? teamFilters : undefined,
    dependencies: dependencies.length > 0 ? dependencies : undefined,
  });

  // Use tRPC to fetch team members
  const { data: teamMembers, isLoading: teamsLoading, error: teamMembersError } = trpc.team.getTeamMembers.useQuery({});

  // Convert team members to team options format
  const teams: TeamOption[] =
    teamMembers
      ?.filter((member) => member.type === 'team' || member.type === 'person')
      .map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        type: member.type as 'person' | 'team' | 'dependency' | 'event',
      })) || [];

  // Show error if team members fetch fails
  useEffect(() => {
    if (teamMembersError) {
      console.error('Error fetching teams:', teamMembersError);
    }
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }
  }, [teamMembersError, projectsError]);

  // Group projects based on the selected groupBy option
  const groups = groupProjects(
    projects,
    groupBy as GroupByOption,
    sortBy as SortByOption,
    sortDirection as SortDirectionOption,
    teams,
  );
  const isGrouped = groupBy !== 'none';

  return (
    <div className="space-y-4">
      <SearchProjects
        teams={teams}
        teamsLoading={teamsLoading}
        columns={PROJECT_COLUMNS}
        isColumnVisible={isColumnVisible}
        toggleColumn={toggleColumn}
        resetToDefaults={resetToDefaults}
      />
      {projectsLoading ? (
        viewMode === 'cards' ? (
          <ProjectsCardSkeleton isGrouped={isGrouped} />
        ) : (
          <ProjectsTableSkeleton isGrouped={isGrouped} isColumnVisible={isColumnVisible} />
        )
      ) : viewMode === 'cards' ? (
        <ProjectsGrid
          groups={groups}
          isGrouped={isGrouped}
          groupBy={groupBy as GroupByOption}
          onUpdateProject={handleUpdateProject}
          teams={teams}
          teamsLoading={teamsLoading}
        />
      ) : (
        <GroupedProjectsTable
          groups={groups}
          isGrouped={isGrouped}
          groupBy={groupBy as GroupByOption}
          onUpdateProject={handleUpdateProject}
          teams={teams}
          teamsLoading={teamsLoading}
          isColumnVisible={isColumnVisible}
        />
      )}
    </div>
  );
}
