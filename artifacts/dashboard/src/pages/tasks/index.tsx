import { useState } from "react";
import { Link } from "wouter";
import { 
  useListTasks, 
  useDeleteTask,
  useCreateTask,
  getListTasksQueryKey,
  useListProjects
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search,
  Filter,
  Calendar,
  MoreHorizontal,
  Trash,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { TaskForm, TaskFormValues } from "@/components/forms/TaskForm";
import { Input } from "@/components/ui/input";

export default function Tasks() {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterProjectId, setFilterProjectId] = useState<number | null>(null);
  
  const { data: tasks, isLoading: tasksLoading } = useListTasks({
    status: filterStatus as any,
    projectId: filterProjectId
  });
  
  const { data: projects } = useListProjects();

  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isTaskOpen, setIsTaskOpen] = useState(false);

  const handleCreateTask = (data: TaskFormValues) => {
    createTask.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        setIsTaskOpen(false);
        toast({ title: "Task created" });
      }
    });
  };

  const handleDeleteTask = (taskId: number) => {
    deleteTask.mutate({ id: taskId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        toast({ title: "Task deleted" });
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "todo": return <Clock size={16} className="text-muted-foreground" />;
      case "in_progress": return <Activity size={16} className="text-blue-500" />;
      case "done": return <CheckCircle2 size={16} className="text-green-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage, filter and prioritize your work.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
              </DialogHeader>
              <TaskForm onSubmit={handleCreateTask} isSubmitting={createTask.isPending} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between bg-card p-2 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-full max-w-sm hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="w-full bg-background pl-8 h-9 text-sm"
              disabled
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter size={14} />
                Status {filterStatus && <Badge variant="secondary" className="ml-1 px-1 py-0 h-4 text-[10px]">{filterStatus}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={filterStatus === null} 
                onCheckedChange={() => setFilterStatus(null)}
              >
                All Statuses
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filterStatus === "todo"} 
                onCheckedChange={() => setFilterStatus("todo")}
              >
                To Do
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filterStatus === "in_progress"} 
                onCheckedChange={() => setFilterStatus("in_progress")}
              >
                In Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem 
                checked={filterStatus === "done"} 
                onCheckedChange={() => setFilterStatus("done")}
              >
                Done
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter size={14} />
                Project {filterProjectId && <Badge variant="secondary" className="ml-1 px-1 py-0 h-4 text-[10px]">1</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Filter by Project</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem 
                checked={filterProjectId === null} 
                onCheckedChange={() => setFilterProjectId(null)}
              >
                All Projects
              </DropdownMenuCheckboxItem>
              {projects?.map(p => (
                <DropdownMenuCheckboxItem 
                  key={p.id}
                  checked={filterProjectId === p.id} 
                  onCheckedChange={() => setFilterProjectId(p.id)}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="truncate">{p.name}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        {tasksLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="divide-y divide-border">
            {tasks.map((task) => (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="mt-0.5">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/tasks/${task.id}`}>
                      <h4 className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer truncate">
                        {task.title}
                      </h4>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="capitalize text-[10px] h-5 px-1.5 bg-background">
                        {getStatusText(task.status)}
                      </Badge>
                      
                      {task.projectId && (
                        <Link href={`/projects/${task.projectId}`} className="hover:text-foreground transition-colors flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-primary/50" />
                          {projects?.find(p => p.id === task.projectId)?.name || `Project ${task.projectId}`}
                        </Link>
                      )}
                      
                      {task.dueDate && (
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar size={12} />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 ml-8 sm:ml-0">
                  <Badge 
                    variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
                    className="uppercase text-[10px] font-bold h-5"
                  >
                    {task.priority}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/tasks/${task.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-bold">No tasks found</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
              {filterStatus || filterProjectId 
                ? "Try adjusting your filters to see more tasks." 
                : "Create a new task to get started."}
            </p>
            {(!filterStatus && !filterProjectId) && (
              <Button onClick={() => setIsTaskOpen(true)} className="mt-6 gap-2" variant="outline">
                <Plus size={16} /> Create First Task
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
