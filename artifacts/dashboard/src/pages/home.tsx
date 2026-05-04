import { useGetStatsSummary, useListRecentTasks, useGetProjectStatusBreakdown } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { format } from "date-fns";
import { Activity, CheckCircle2, Clock, ListTodo, AlertTriangle, ArrowRight, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, StackedBarChart } from "recharts";

function StatCard({ title, value, icon: Icon, description, isLoading }: any) {
  return (
    <Card className="shadow-sm border-border overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold tracking-tighter">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary();
  const { data: recentTasks, isLoading: tasksLoading } = useListRecentTasks();
  const { data: breakdown, isLoading: breakdownLoading } = useGetProjectStatusBreakdown();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your workspace and active tasks.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard 
          title="Total Projects" 
          value={stats?.totalProjects ?? 0} 
          icon={BarChart3} 
          isLoading={statsLoading} 
        />
        <StatCard 
          title="Total Tasks" 
          value={stats?.totalTasks ?? 0} 
          icon={ListTodo} 
          isLoading={statsLoading} 
        />
        <StatCard 
          title="Completed" 
          value={stats?.completedTasks ?? 0} 
          icon={CheckCircle2} 
          isLoading={statsLoading} 
        />
        <StatCard 
          title="In Progress" 
          value={stats?.inProgressTasks ?? 0} 
          icon={Activity} 
          isLoading={statsLoading} 
        />
        <StatCard 
          title="To Do" 
          value={stats?.todoTasks ?? 0} 
          icon={Clock} 
          isLoading={statsLoading} 
        />
        <StatCard 
          title="High Priority" 
          value={stats?.highPriorityTasks ?? 0} 
          icon={AlertTriangle} 
          isLoading={statsLoading} 
          description="Requires attention"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-border flex flex-col">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Project Status</CardTitle>
                <CardDescription>Task distribution across active projects</CardDescription>
              </div>
              <Link href="/projects" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1 min-h-[300px]">
            {breakdownLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="w-full h-[250px] rounded-lg" />
              </div>
            ) : breakdown && breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="projectName" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
                  />
                  <RechartsTooltip 
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      boxShadow: "var(--shadow-md)"
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                  <Bar dataKey="todoCount" name="To Do" stackId="a" fill="hsl(var(--muted-foreground))" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="inProgressCount" name="In Progress" stackId="a" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="doneCount" name="Done" stackId="a" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground h-[250px]">
                <BarChart3 className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-sm font-medium">No project data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border flex flex-col">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Tasks</CardTitle>
                <CardDescription>Latest updates</CardDescription>
              </div>
              <Link href="/tasks" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            {tasksLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentTasks && recentTasks.length > 0 ? (
              <div className="divide-y divide-border">
                {recentTasks.map(task => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-sm font-medium">
                              {task.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock size={10} />
                                {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <Badge 
                            variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
                            className="text-[10px] uppercase font-bold"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[250px]">
                <CheckSquare className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-sm font-medium">No recent tasks</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
