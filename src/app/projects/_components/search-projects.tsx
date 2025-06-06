'use client';

import { parseAsString, parseAsBoolean, useQueryState } from 'nuqs';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ArchiveIcon, SearchIcon } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { ProjectGroupSelector } from '@/app/projects/_components/project-group-selector';
import { ProjectSortSelector } from '@/app/projects/_components/project-sort-selector';
import { AdvancedProjectFilters } from '@/app/projects/_components/advanced-project-filters';
import { Button } from '@/components/ui/button';
import { TeamOption } from '@/components/team-selector';
import { ColumnToggle } from '@/app/projects/_components/column-toggle';
import { ColumnDefinition } from '@/hooks/use-column-visibility';
import { ViewToggle, useViewMode } from '@/app/projects/_components/view-toggle';

interface SearchProjectsProps {
  teams: TeamOption[];
  teamsLoading: boolean;
  columns: ColumnDefinition[];
  isColumnVisible: (columnId: string) => boolean;
  toggleColumn: (columnId: string) => void;
  resetToDefaults: () => void;
}

export function SearchProjects({
  teams,
  teamsLoading,
  columns,
  isColumnVisible,
  toggleColumn,
  resetToDefaults,
}: SearchProjectsProps) {
  const viewMode = useViewMode();
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));

  const [includeArchived, setIncludeArchived] = useQueryState('includeArchived', parseAsBoolean.withDefault(false));

  const debouncedUpdateParams = useDebounce(setSearch, 300);

  // Update search params and navigate
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedUpdateParams(e.target.value, undefined);
    },
    [debouncedUpdateParams],
  );

  const handleArchivedToggle = useCallback(() => {
    setIncludeArchived((prev) => !prev);
  }, [setIncludeArchived]);

  return (
    <div className="space-y-4 mb-6">
      {/* Mobile-first layout: Stack everything vertically on small screens */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Search and Archive Toggle Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-9 h-10"
              defaultValue={search}
              onChange={handleSearchChange}
            />
          </div>

          {/* Archive Toggle */}
          <Button
            variant="outline"
            size="default"
            className="h-10 px-3 gap-2 whitespace-nowrap"
            onClick={handleArchivedToggle}
          >
            <ArchiveIcon
              className={`h-4 w-4 ${includeArchived ? 'text-foreground' : 'text-muted-foreground'}`}
              strokeWidth={includeArchived ? 2 : 1}
            />
            <span className="text-sm">{includeArchived ? 'Hide Archived' : 'Show Archived'}</span>
          </Button>
        </div>

        {/* View Controls Row */}
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            <ViewToggle />
            <ProjectGroupSelector />
            <ProjectSortSelector />
          </div>
          {viewMode === 'table' && (
            <ColumnToggle
              columns={columns}
              isColumnVisible={isColumnVisible}
              toggleColumn={toggleColumn}
              resetToDefaults={resetToDefaults}
            />
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedProjectFilters teams={teams} teamsLoading={teamsLoading} />
    </div>
  );
}
