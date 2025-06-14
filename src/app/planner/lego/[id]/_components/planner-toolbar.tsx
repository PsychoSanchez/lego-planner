'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MousePointer2, Paintbrush, Eraser, GlassesIcon, Undo2, Redo2 } from 'lucide-react';
import { Project } from '@/lib/types';
import { getProjectColorByName, getDefaultProjectColor } from '@/lib/project-colors';
import { getProjectIcon } from '@/lib/utils/icons';
import { cn } from '@/lib/utils';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type PlannerMode = 'pointer' | 'paint' | 'erase' | 'inspect';

interface PlannerToolbarProps {
  selectedProjectId?: string;
  onProjectSelect: (projectId: string) => void;
  regularProjects: Project[];
  defaultProjects: Project[];
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function usePlannerToolbarMode() {
  const [mode, setMode] = useQueryState(
    'mode',
    parseAsStringEnum(['pointer', 'paint', 'erase', 'inspect']).withDefault('pointer'),
  );

  return [mode, setMode] as const;
}

export function PlannerToolbar({
  selectedProjectId,
  onProjectSelect,
  regularProjects,
  defaultProjects,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: PlannerToolbarProps) {
  const [mode, setMode] = usePlannerToolbarMode();
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Combine all projects for navigation
  const allProjects = useMemo(() => [...regularProjects, ...defaultProjects], [regularProjects, defaultProjects]);

  const handleProjectSelect = useCallback(
    (projectId: string) => {
      onProjectSelect(projectId);
      setIsProjectSelectorOpen(false);
    },
    [onProjectSelect],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('handleKeyDown', event.key);
      // Don't handle shortcuts if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Mode selection shortcuts
      if (!isProjectSelectorOpen) {
        switch (event.key.toLowerCase()) {
          case 'v':
            event.preventDefault();
            setMode('pointer');
            break;
          case 'b':
            event.preventDefault();
            setMode('paint');
            setIsProjectSelectorOpen(true);
            setSelectedProjectIndex(0);
            break;
          case 'e':
            event.preventDefault();
            setMode('erase');
            break;
          case 'i':
            event.preventDefault();
            setMode('inspect');
            break;
        }
      }

      // Project selection shortcuts (when paint popover is open)
      if (isProjectSelectorOpen && allProjects.length > 0) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setSelectedProjectIndex((prev) => (prev < allProjects.length - 1 ? prev + 1 : 0));
            break;
          case 'ArrowUp':
            event.preventDefault();
            setSelectedProjectIndex((prev) => (prev > 0 ? prev - 1 : allProjects.length - 1));
            break;
          case 'Enter':
            event.preventDefault();
            if (allProjects[selectedProjectIndex]) {
              handleProjectSelect(allProjects[selectedProjectIndex].id);
            }
            break;
          case 'Escape':
            event.preventDefault();
            setIsProjectSelectorOpen(false);
            if (!selectedProjectId) {
              setMode('pointer');
            }
            break;
        }
      }
    };

    // Use capture phase to ensure we get the events first
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [mode, setMode, isProjectSelectorOpen, selectedProjectIndex, allProjects, selectedProjectId, handleProjectSelect]);

  // Reset selected project index when popover opens
  useEffect(() => {
    if (isProjectSelectorOpen) {
      setSelectedProjectIndex(0);
    }
  }, [isProjectSelectorOpen]);

  const handleModeChange = (value: string | undefined) => {
    if (value) {
      const newMode = value as PlannerMode;

      // If paint mode is selected, automatically open project selector
      if (newMode === 'paint') {
        setMode(newMode);
        setIsProjectSelectorOpen(true);
        setSelectedProjectIndex(0);
      } else {
        setMode(newMode);
        setIsProjectSelectorOpen(false);
      }
    }
  };

  const handleProjectSelectorOpenChange = (open: boolean) => {
    setIsProjectSelectorOpen(open);

    // If popover is closed and we're in paint mode but no project is selected,
    // reset to pointer mode
    if (!open && mode === 'paint' && !selectedProjectId) {
      setMode('pointer');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Undo/Redo Buttons */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo (Cmd+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Undo <kbd className="ml-1 px-1 py-0.5 text-xs rounded">⌘Z</kbd>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo (Cmd+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Redo <kbd className="ml-1 px-1 py-0.5 text-xs rounded">⌘⇧Z</kbd>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* Mode Selection */}
      <ToggleGroup type="single" variant="outline" value={mode} onValueChange={handleModeChange} className="h-8">
        <ToggleGroupItem value="pointer" className="text-xs px-3 h-8 flex items-center gap-1">
          <MousePointer2 className="h-4 w-4" />
          <span>Pointer</span>
          <kbd className="ml-1 px-1 py-0.5 text-xs bg-muted rounded">V</kbd>
        </ToggleGroupItem>

        {/* Paint button with popover */}
        <Popover open={isProjectSelectorOpen} onOpenChange={handleProjectSelectorOpenChange}>
          <PopoverTrigger asChild>
            <ToggleGroupItem
              value="paint"
              className={cn('text-xs px-3 h-8 flex items-center gap-1', mode === 'paint' && 'bg-accent')}
            >
              <Paintbrush className="h-4 w-4" />
              <span>Paint</span>
              <kbd className="ml-1 px-1 py-0.5 text-xs bg-muted rounded">B</kbd>
            </ToggleGroupItem>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start" ref={popoverRef}>
            <div className="max-h-96 overflow-y-auto">
              <div className="px-3 py-2 text-xs text-muted-foreground border-b bg-muted/50">
                Use ↑↓ arrows to navigate, Enter to select, Esc to close
              </div>
              {/* Regular projects */}
              {regularProjects.length > 0 && (
                <>
                  {regularProjects.map((project, index) => {
                    const projectColor = getProjectColorByName(project.color) || getDefaultProjectColor();
                    const borderClass = projectColor.borderColor;
                    const isHighlighted = selectedProjectIndex === index;

                    return (
                      <div
                        key={project.id}
                        className={cn(
                          `flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground relative overflow-hidden border-l-4 ${borderClass}`,
                          selectedProjectId === project.id && 'bg-accent',
                          isHighlighted && 'bg-accent/50',
                        )}
                        onClick={() => handleProjectSelect(project.id)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getProjectIcon(project.type)}
                          <span className="truncate font-normal">
                            <span className="text-muted-foreground">{project.slug}:</span> {project.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Default projects */}
              {defaultProjects.length > 0 && (
                <>
                  {regularProjects.length > 0 && <div className="border-t" />}
                  {defaultProjects.map((project, index) => {
                    const projectColor = getProjectColorByName(project.color) || getDefaultProjectColor();
                    const borderClass = projectColor.borderColor;
                    const adjustedIndex = regularProjects.length + index;
                    const isHighlighted = selectedProjectIndex === adjustedIndex;

                    return (
                      <div
                        key={project.id}
                        className={cn(
                          `flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground relative overflow-hidden border-l-4 ${borderClass}`,
                          selectedProjectId === project.id && 'bg-accent',
                          isHighlighted && 'bg-accent/50',
                        )}
                        onClick={() => handleProjectSelect(project.id)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getProjectIcon(project.type)}
                          <span className="truncate text-muted-foreground font-normal">
                            <span className="text-muted-foreground/70">{project.slug}:</span> {project.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <ToggleGroupItem value="erase" className="text-xs px-3 h-8 flex items-center gap-1">
          <Eraser className="h-4 w-4" />
          <span>Erase</span>
          <kbd className="ml-1 px-1 py-0.5 text-xs bg-muted rounded">E</kbd>
        </ToggleGroupItem>
        <ToggleGroupItem value="inspect" className="text-xs px-3 h-8 flex items-center gap-1">
          <GlassesIcon className="h-4 w-4" />
          <span>Inspect</span>
          <kbd className="ml-1 px-1 py-0.5 text-xs bg-muted rounded">I</kbd>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
