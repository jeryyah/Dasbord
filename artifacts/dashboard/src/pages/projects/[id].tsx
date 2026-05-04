import { useParams, Link } from "wouter";
import { useState } from "react";
import { 
  useGetProject, 
  useListTasks, 
  useUpdateTask, 
  useDeleteTask,
  useCreateTask,
  getGetProjectQueryKey,
  getListTasksQueryKey,
  useUpdateProject
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  Trash,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  FolderKanban
} from "lucide-react";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { TaskForm, TaskFormValues } from "@/components/forms/TaskForm";
import { ProjectForm, ProjectFormValues } from "@/components/forms/ProjectForm";

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);
  
  const { data: project, isLoading: projectLoading } = useGetProject(projectId, { 
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) } 
  });
  
  const { data: tasks, isLoading: tasksLoading } = useListTasks(
    { projectId },
    { query: { enabled: !!projectId, queryKey: getListTasksQueryKey({ projectId }) } }
  );

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const updateProject = useUpdateProject();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleCreateTask = (data: TaskFormValues) => {
    createTask.mutate({ data: { ...data, projectId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ projectId }) });
        setIsTaskOpen(false);
        toast({ title: "Task added" });
      }
    });
  };

  const handleUpdateProject = (data: ProjectFormValues) => {
    updateProject.mutate({ id: projectId, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
        setIsEditOpen(false);
        toast({ title: "Project updated" });
      }
    });
  };

  const handleStatusChange = (taskId: number, newStatus: any) => {
    updateTask.mutate({ id: taskId, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ projectId }) });
      }
    });
  };

  const handleDeleteTask = (taskId: number) => {
    deleteTask.mutate({ id: taskId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ projectId }) });
        toast({ title: "Task deleted" });
      }
    });
  };

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Link href="/projects">
          <Button variant="link" className="mt-4">Return to Projects</Button>
        </Link>
      </div>
    );
  }

  const todoTasks = tasks?.filter(t => t.status === "todo") || [];
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || [];
  const doneTasks = tasks?.filter(t => t.status === "done") || [];

  const Column = ({ title, icon: Icon, items, statusValue }: any) => (
    <div className="flex-1 min-w-[300px] flex flex-col gap-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Icon size={16} className="text-muted-foreground" />
          {title}
          <Badge variant="secondary" className="ml-1 text-xs">{items.length}</Badge>
        </h3>
      </div>
      <div className="space-y-3">
        {items.map((task: any) => (
          <div key={task.id} className="bg-card border rounded-lg p-4 shadow-sm group">
            <div className="flex justify-between items-start mb-2">
              <Link href={`/tasks/${task.id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                {task.title}
              </Link>
              <Badge 
                variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
                className="text-[10px] uppercase h-5 px-1.5"
              >
                {task.priority}
              </Badge>
            </div>
            
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              {task.dueDate ? (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={12} />
                  {format(new Date(task.dueDate), 'MMM d, yyyy')}
                </div>
              ) : <div />}
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {statusValue !== "todo" && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleStatusChange(task.id, "todo")}>
                    <Clock size={12} />
                  </Button>
                )}
                {statusValue !== "in_progress" && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-blue-500" onClick={() => handleStatusChange(task.id, "in_progress")}>
                    <Activity size={12} />
                  </Button>
                )}
                {statusValue !== "done" && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-green-500" onClick={() => handleStatusChange(task.id, "done")}>
                    <CheckCircle2 size={12} />
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTask(task.id)}>
                  <Trash size={12} />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-8 text-center bg-muted/30 border border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground font-medium">No tasks here</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/projects">
        <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground">
          <ArrowLeft size={16} /> Back to Projects
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg border border-border shadow-sm relative overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-1 h-full" 
          style={{ backgroundColor: project.color }}
        />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-2 max-w-2xl">{project.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-medium">
            <span>Created {format(new Date(project.createdAt), 'MMMM d, yyyy')}</span>
            <span>•</span>
            <span>{tasks?.length || 0} Total Tasks</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings size={14} /> Edit Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              <ProjectForm defaultValues={project} onSubmit={handleUpdateProject} isSubmitting={updateProject.isPending} />
            </DialogContent>
          </Dialog>

          <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus size={14} /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Task in {project.name}</DialogTitle>
              </DialogHeader>
              <TaskForm projectIdOverride={project.id} onSubmit={handleCreateTask} isSubmitting={createTask.isPending} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mt-8">
        {tasksLoading ? (
          <div className="flex gap-6 overflow-x-auto pb-4">
            <Skeleton className="flex-1 min-w-[300px] h-[500px]" />
            <Skeleton className="flex-1 min-w-[300px] h-[500px]" />
            <Skeleton className="flex-1 min-w-[300px] h-[500px]" />
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4 items-start">
            <Column title="To Do" icon={Clock} items={todoTasks} statusValue="todo" />
            <Column title="In Progress" icon={Activity} items={inProgressTasks} statusValue="in_progress" />
            <Column title="Done" icon={CheckCircle2} items={doneTasks} statusValue="done" />
          </div>
        )}
      </div>
    </div>
  );
}
