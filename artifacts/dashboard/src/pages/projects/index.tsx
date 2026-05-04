import { useState } from "react";
import { Link } from "wouter";
import { 
  useListProjects, 
  useCreateProject, 
  useDeleteProject,
  getListProjectsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProjectForm, ProjectFormValues } from "@/components/forms/ProjectForm";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderKanban, MoreVertical, Trash, Edit, ArrowRight } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreate = (data: ProjectFormValues) => {
    createProject.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setIsCreateOpen(false);
        toast({ title: "Project created", description: "Your project has been created successfully." });
      },
      onError: (err) => {
        toast({ title: "Failed to create project", description: "An error occurred.", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteProject.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: "Project deleted", description: "The project has been removed." });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not delete project.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage all your projects and initiatives.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>Define a new project space to organize tasks.</DialogDescription>
            </DialogHeader>
            <ProjectForm onSubmit={handleCreate} isSubmitting={createProject.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : projects && projects.length > 0 ? (
          projects.map((project) => (
            <Card key={project.id} className="shadow-sm border-border hover:border-primary/30 transition-colors flex flex-col group relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 w-1 h-full" 
                style={{ backgroundColor: project.color }}
              />
              <CardHeader className="pb-3 pl-6 pr-4">
                <div className="flex justify-between items-start gap-4">
                  <Link href={`/projects/${project.id}`} className="block flex-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {project.name}
                    </CardTitle>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mt-1 -mr-1">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash className="mr-2 h-4 w-4" /> Delete Project
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. All tasks inside this project will lose their association with it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(project.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-2 mt-1 text-sm">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="mt-auto pt-4 pl-6 flex justify-between items-center text-xs text-muted-foreground border-t bg-muted/10">
                <span className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                  {project.color}
                </span>
                <Link href={`/projects/${project.id}`} className="font-semibold text-primary flex items-center gap-1 hover:underline">
                  Open <ArrowRight size={12} />
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-card border rounded-lg border-dashed">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <FolderKanban size={24} />
            </div>
            <h3 className="text-lg font-bold">No projects yet</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Create a project to start organizing related tasks together.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="mt-6 gap-2" variant="outline">
              <Plus size={16} /> Create First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
