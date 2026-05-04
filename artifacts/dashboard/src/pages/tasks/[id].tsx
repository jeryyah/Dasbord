import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  useGetTask, 
  useUpdateTask, 
  useDeleteTask,
  useGetProject,
  getGetTaskQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Calendar,
  CheckCircle2,
  Clock,
  Activity,
  Trash,
  Edit,
  FolderKanban,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
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
import { TaskForm, TaskFormValues } from "@/components/forms/TaskForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TaskDetail() {
  const { id } = useParams();
  const taskId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  
  const { data: task, isLoading: taskLoading } = useGetTask(taskId, { 
    query: { enabled: !!taskId, queryKey: getGetTaskQueryKey(taskId) } 
  });
  
  const { data: project } = useGetProject(task?.projectId || 0, {
    query: { enabled: !!task?.projectId }
  });

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleUpdateTask = (data: TaskFormValues) => {
    updateTask.mutate({ id: taskId, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
        setIsEditOpen(false);
        toast({ title: "Task updated successfully" });
      }
    });
  };

  const handleStatusChange = (newStatus: string) => {
    updateTask.mutate({ id: taskId, data: { status: newStatus as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
      }
    });
  };

  const handleDelete = () => {
    deleteTask.mutate({ id: taskId }, {
      onSuccess: () => {
        toast({ title: "Task deleted" });
        setLocation("/tasks");
      }
    });
  };

  if (taskLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Task not found</h2>
        <Link href="/tasks">
          <Button variant="link" className="mt-4">Return to Tasks</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <Link href="/tasks">
        <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground">
          <ArrowLeft size={16} /> Back to Tasks
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="space-y-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
              className="uppercase text-xs font-bold px-2 py-0.5"
            >
              {task.priority} Priority
            </Badge>
            
            <Select 
              value={task.status} 
              onValueChange={handleStatusChange}
              disabled={updateTask.isPending}
            >
              <SelectTrigger className="h-6 w-auto px-2 gap-2 text-xs border-dashed bg-muted/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">
                  <span className="flex items-center gap-2">
                    <Clock size={12} /> To Do
                  </span>
                </SelectItem>
                <SelectItem value="in_progress">
                  <span className="flex items-center gap-2">
                    <Activity size={12} className="text-blue-500" /> In Progress
                  </span>
                </SelectItem>
                <SelectItem value="done">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-green-500" /> Done
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {project && (
              <Link href={`/projects/${project.id}`}>
                <Badge variant="outline" className="gap-1.5 hover:bg-muted cursor-pointer transition-colors border-dashed">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                  {project.name}
                </Badge>
              </Link>
            )}
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground leading-tight">
            {task.title}
          </h1>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {task.dueDate && (
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar size={14} />
                Due {format(new Date(task.dueDate), 'MMMM d, yyyy')}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              Created {format(new Date(task.createdAt), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 md:pt-4">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit size={14} /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <TaskForm defaultValues={task} onSubmit={handleUpdateTask} isSubmitting={updateTask.isPending} />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Trash size={14} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this task? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 min-h-[300px] shadow-sm mt-8">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2">Description</h3>
        {task.description ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap">
            {task.description}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No description provided.</p>
            <Button variant="link" size="sm" onClick={() => setIsEditOpen(true)} className="mt-2">
              Add description
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
