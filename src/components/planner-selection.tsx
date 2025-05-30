// Needs to be rethought and refactored

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { EmptyPlaceholder } from '@/components/ui/empty-placeholder';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Trash, Check, Edit } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { Planner, Project, Assignee } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  CompactCard,
  CompactCardHeader,
  CompactCardTitle,
  CompactCardDescription,
  CompactCardContent,
  CompactCardFooter,
} from '@/components/ui/compact-card';
import { trpc } from '@/utils/trpc';

interface PlannerDialogProps {
  mode: 'create' | 'edit';
  planner?: Planner; // Required for edit mode
  onSubmit: (data: { name: string; projects: Project[]; assignees: Assignee[] }) => Promise<void>;
  yearValue: number;
  quarterValue: number;
  trigger?: React.ReactNode;
}

function PlannerDialog({ mode, planner, onSubmit, yearValue, quarterValue, trigger }: PlannerDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(
    mode === 'edit' && planner ? planner.name : `Q${quarterValue} ${yearValue} Lego Planner`,
  );
  const [selectedProjects, setSelectedProjects] = useState<Project[]>(
    mode === 'edit' && planner ? planner.projects : [],
  );
  const [selectedAssignees, setSelectedAssignees] = useState<Assignee[]>(
    mode === 'edit' && planner ? planner.assignees : [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search states
  const [projectSearch, setProjectSearch] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const { toast } = useToast();

  // Use tRPC to fetch team members
  const {
    data: teamMembers,
    isLoading: isLoadingAssignees,
    error: teamMembersError,
  } = trpc.team.getTeamMembers.useQuery({}, { enabled: open });

  // Convert team members to assignees format
  const availableAssignees: Assignee[] =
    teamMembers?.map((member) => ({
      id: member.id,
      name: member.name,
      type: (member.type as 'person' | 'team' | 'dependency' | 'event') || 'person',
    })) || [];

  // Show error toast if team members fetch fails
  useEffect(() => {
    if (teamMembersError) {
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    }
  }, [teamMembersError, toast]);

  // Use tRPC to fetch projects
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = trpc.project.getProjects.useQuery({}, { enabled: open });

  const availableProjects = projectsData?.projects || [];

  // Show error toast if projects fetch fails
  useEffect(() => {
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    }
  }, [projectsError, toast]);

  // Reset form when dialog opens in edit mode
  useEffect(() => {
    if (mode === 'edit' && planner && open) {
      setName(planner.name);
      setSelectedProjects(planner.projects);
      setSelectedAssignees(planner.assignees);
    }
  }, [mode, open, planner]);

  const toggleProject = (project: Project) => {
    setSelectedProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      if (exists) {
        return prev.filter((p) => p.id !== project.id);
      } else {
        return [...prev, project];
      }
    });
  };

  const toggleAssignee = (assignee: Assignee) => {
    setSelectedAssignees((prev) => {
      const exists = prev.some((a) => a.id === assignee.id);
      if (exists) {
        return prev.filter((a) => a.id !== assignee.id);
      } else {
        return [...prev, assignee];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit({
        name,
        projects: selectedProjects,
        assignees: selectedAssignees,
      });
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(`Failed to ${mode} planner:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (mode === 'create') {
      setName(`Q${quarterValue} ${yearValue} Lego Planner`);
      setSelectedProjects([]);
      setSelectedAssignees([]);
    } else if (mode === 'edit' && planner) {
      setName(planner.name);
      setSelectedProjects(planner.projects);
      setSelectedAssignees(planner.assignees);
    }
    setProjectSearch('');
    setAssigneeSearch('');
  };

  const isFormValid = name.trim() !== '' && selectedAssignees.length > 0;

  const defaultTrigger =
    mode === 'create' ? (
      <Button className="gap-2">
        <PlusCircle className="h-4 w-4" />
        New Planner
      </Button>
    ) : (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Edit className="h-4 w-4" />
      </Button>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-3">
          <DialogTitle>{mode === 'create' ? 'Create New Lego Planner' : 'Edit Lego Planner'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? `Configure your planner for Q${quarterValue} ${yearValue}`
              : `Update your planner configuration`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Planner Name */}
          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm font-medium">
              Planner Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter planner name..."
            />
          </div>

          {/* Projects Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Additional Projects ({selectedProjects.length})</Label>
              {selectedProjects.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProjects([])}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Default projects (Vacation, Duty, Sick Leave, Team Event) are always available
            </div>

            {isLoadingProjects ? (
              <div className="flex items-center justify-center py-6 border rounded-md">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
              </div>
            ) : availableProjects.length === 0 ? (
              <div className="text-center py-6 border rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">No projects available</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Search projects..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="h-8 text-sm"
                />

                <div className="border rounded-md max-h-[140px] overflow-y-auto">
                  {availableProjects.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">No projects match your search</div>
                  ) : (
                    <div className="p-1">
                      {availableProjects.map((project) => {
                        const isSelected = selectedProjects.some((p) => p.id === project.id);
                        return (
                          <div
                            key={project.id}
                            className={cn(
                              'flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors',
                              isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50',
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProject(project);
                            }}
                          >
                            <div
                              className={cn(
                                'flex h-3 w-3 items-center justify-center rounded border transition-colors',
                                isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40',
                              )}
                            >
                              {isSelected && <Check className="h-2 w-2 text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0 flex items-center gap-1">
                              {project.icon && <span className="text-xs">{project.icon}</span>}
                              <p className="text-xs font-medium truncate">{project.name}</p>
                            </div>
                            {project.type && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                {project.type}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Team Members Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Team Members ({selectedAssignees.length})</Label>
              {selectedAssignees.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAssignees([])}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>

            {isLoadingAssignees ? (
              <div className="flex items-center justify-center py-6 border rounded-md">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
              </div>
            ) : availableAssignees.length === 0 ? (
              <div className="text-center py-6 border rounded-md bg-muted/30">
                <p className="text-xs text-muted-foreground">No team members available</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Search team members..."
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  className="h-8 text-sm"
                />

                <div className="border rounded-md max-h-[140px] overflow-y-auto">
                  {availableAssignees.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No team members match your search
                    </div>
                  ) : (
                    <div className="p-1">
                      {availableAssignees.map((assignee) => {
                        const isSelected = selectedAssignees.some((a) => a.id === assignee.id);
                        return (
                          <div
                            key={assignee.id}
                            className={cn(
                              'flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors',
                              isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50',
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAssignee(assignee);
                            }}
                          >
                            <div
                              className={cn(
                                'flex h-3 w-3 items-center justify-center rounded border transition-colors',
                                isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40',
                              )}
                            >
                              {isSelected && <Check className="h-2 w-2 text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{assignee.name}</p>
                            </div>
                            <Badge
                              variant={assignee.type === 'team' ? 'default' : 'secondary'}
                              className="text-[10px] h-4 px-1"
                            >
                              {assignee.type === 'team' ? 'Team' : 'Person'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Compact Selection Summary */}
          {(selectedProjects.length > 0 || selectedAssignees.length > 0) && (
            <div className="bg-muted/30 rounded-md p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Selected:</span>
                <span className="font-medium">
                  {selectedProjects.length} projects, {selectedAssignees.length} members
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">{!isFormValid && <span>Select team members</span>}</div>
            <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="h-8 px-4">
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : mode === 'create' ? (
                'Create Planner'
              ) : (
                'Update Planner'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Legacy component for backward compatibility
function CreatePlannerDialog({
  onCreatePlanner,
  yearValue,
  quarterValue,
}: {
  onCreatePlanner: (data: { name: string; projects: Project[]; assignees: Assignee[] }) => Promise<void>;
  yearValue: number;
  quarterValue: number;
}) {
  return <PlannerDialog mode="create" onSubmit={onCreatePlanner} yearValue={yearValue} quarterValue={quarterValue} />;
}

export function PlannerSelection() {
  const defaultYear = new Date().getFullYear();
  const defaultQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const [yearValue] = useQueryState('year', parseAsInteger.withDefault(defaultYear));
  const [quarterValue] = useQueryState('quarter', parseAsInteger.withDefault(defaultQuarter));

  const { toast } = useToast();
  const router = useRouter();

  // Use tRPC to fetch planners
  const {
    data: plannersData,
    isLoading,
    error: plannersError,
  } = trpc.planner.getPlanners.useQuery({
    year: yearValue,
    quarter: quarterValue,
  });

  const planners = plannersData?.planners || [];

  // tRPC mutations
  const utils = trpc.useUtils();

  const createPlannerMutation = trpc.planner.createPlanner.useMutation({
    onSuccess: () => {
      utils.planner.getPlanners.invalidate();
      toast({
        title: 'Success',
        description: 'New planner created successfully',
      });
    },
    onError: (error) => {
      console.error('Failed to create planner:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new planner',
        variant: 'destructive',
      });
    },
  });

  const updatePlannerMutation = trpc.planner.updatePlanner.useMutation({
    onSuccess: () => {
      utils.planner.getPlanners.invalidate();
      toast({
        title: 'Success',
        description: 'Planner updated successfully',
      });
    },
    onError: (error) => {
      console.error('Failed to update planner:', error);
      toast({
        title: 'Error',
        description: 'Failed to update planner',
        variant: 'destructive',
      });
    },
  });

  const deletePlannerMutation = trpc.planner.deletePlanner.useMutation({
    onSuccess: () => {
      utils.planner.getPlanners.invalidate();
      toast({
        title: 'Success',
        description: 'Planner deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Failed to delete planner:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete planner',
        variant: 'destructive',
      });
    },
  });

  // Show error toast if planners fetch fails
  useEffect(() => {
    if (plannersError) {
      console.error('Failed to load planners:', plannersError);
      toast({
        title: 'Error',
        description: 'Failed to load planners',
        variant: 'destructive',
      });
    }
  }, [plannersError, toast]);

  const handleCreatePlanner = async (data: { name: string; projects: Project[]; assignees: Assignee[] }) => {
    try {
      // Extract just the IDs for the API
      await createPlannerMutation.mutateAsync({
        name: data.name,
        projects: data.projects.map((project) => project.id),
        assignees: data.assignees.map((assignee) => assignee.id),
      });
    } catch (error) {
      // Error is already handled in the mutation onError callback
      throw error; // Re-throw to handle in the dialog
    }
  };

  const handleUpdatePlanner = async (
    plannerId: string,
    data: { name: string; projects: Project[]; assignees: Assignee[] },
  ) => {
    try {
      // Extract just the IDs for the API
      await updatePlannerMutation.mutateAsync({
        id: plannerId,
        name: data.name,
        projects: data.projects.map((project) => project.id),
        assignees: data.assignees.map((assignee) => assignee.id),
      });
    } catch (error) {
      // Error is already handled in the mutation onError callback
      throw error; // Re-throw to handle in the dialog
    }
  };

  const handleOpenPlanner = (plannerId: string) => {
    router.push(`/planner/lego/${plannerId}`);
  };

  const handleDeletePlanner = async (plannerId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      await deletePlannerMutation.mutateAsync({ id: plannerId });
    } catch (error) {
      // Error is already handled in the mutation onError callback
      console.error('Failed to delete planner:', error);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-row justify-center items-center gap-2">
          <h1 className="text-xl font-bold">Lego Planners</h1>
          <p className="text-muted-foreground">
            Q{quarterValue} {yearValue} - {planners.length} planner{planners.length !== 1 ? 's' : ''}
          </p>
        </div>
        <CreatePlannerDialog onCreatePlanner={handleCreatePlanner} yearValue={yearValue} quarterValue={quarterValue} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : planners.length === 0 ? (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="file" />
          <EmptyPlaceholder.Title>No planners found</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            Create your first planner for Q{quarterValue} {yearValue}.
          </EmptyPlaceholder.Description>
          <CreatePlannerDialog
            onCreatePlanner={handleCreatePlanner}
            yearValue={yearValue}
            quarterValue={quarterValue}
          />
        </EmptyPlaceholder>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planners.map((planner) => (
            <CompactCard
              key={planner.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenPlanner(planner.id)}
            >
              <CompactCardHeader>
                <CompactCardTitle>{planner.name || `Lego Planner ${planner.id.substring(0, 8)}`}</CompactCardTitle>
                <CompactCardDescription>
                  {planner.projects.length} projects, {planner.assignees.length} assignees
                </CompactCardDescription>
              </CompactCardHeader>
              <CompactCardContent>
                <div className="text-sm text-muted-foreground">
                  <div>Projects: {planner.projects.length}</div>
                  <div>Assignees: {planner.assignees.length}</div>
                </div>
              </CompactCardContent>
              <CompactCardFooter className="flex justify-between">
                <div className="text-xs text-muted-foreground">
                  Q{quarterValue} {yearValue}
                </div>
                <div className="flex gap-1">
                  <PlannerDialog
                    mode="edit"
                    planner={planner}
                    onSubmit={(data) => handleUpdatePlanner(planner.id, data)}
                    yearValue={yearValue}
                    quarterValue={quarterValue}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => handleDeletePlanner(planner.id, e)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CompactCardFooter>
            </CompactCard>
          ))}
        </div>
      )}
    </div>
  );
}
