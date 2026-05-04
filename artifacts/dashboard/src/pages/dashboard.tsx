import { useGetStats, useGetKeys, useGetLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, ShieldCheck, ShieldAlert, Ban, Smartphone, Activity, TrendingUp, Clock, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();
  const { data: keysData, isLoading: keysLoading } = useGetKeys();
  const { data: logsData, isLoading: logsLoading } = useGetLogs();
  const [, setLocation] = useLocation();

  const recentKeys = keysData?.keys
    ? [...keysData.keys].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)
    : [];

  const recentActivity = logsData?.logs?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview aktivitas HEADSETTING license operations.</p>
        </div>
        <Button onClick={() => setLocation("/keys")} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Generate Key
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Keys" value={stats?.totalKeys} icon={<Key className="h-4 w-4 text-muted-foreground" />} loading={isLoading} />
        <StatCard title="Active Keys" value={stats?.activeKeys} icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />} loading={isLoading} accent="text-emerald-600" badge="bg-emerald-50 text-emerald-700 border-emerald-200" badgeLabel="Healthy" />
        <StatCard title="Expired Keys" value={stats?.expiredKeys} icon={<ShieldAlert className="h-4 w-4 text-amber-500" />} loading={isLoading} accent="text-amber-600" badge="bg-amber-50 text-amber-700 border-amber-200" badgeLabel="Perlu perhatian" />
        <StatCard title="Banned Keys" value={stats?.bannedKeys} icon={<Ban className="h-4 w-4 text-red-500" />} loading={isLoading} accent="text-red-600" badge="bg-red-50 text-red-700 border-red-200" badgeLabel="Diblokir" />
        <StatCard title="Total Devices" value={stats?.totalDevices} icon={<Smartphone className="h-4 w-4 text-blue-500" />} loading={isLoading} accent="text-blue-600" />
        <StatCard title="Aktivasi Hari Ini" value={stats?.todayActivations} icon={<Activity className="h-4 w-4 text-violet-500" />} loading={isLoading} accent="text-violet-600" badge="bg-violet-50 text-violet-700 border-violet-200" badgeLabel="Hari ini" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Riwayat Key Terbaru</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Key yang baru dibuat</p>
            </div>
            <button onClick={() => setLocation("/keys")} className="text-xs text-primary hover:underline font-medium">Lihat semua →</button>
          </CardHeader>
          <CardContent className="p-0">
            {keysLoading ? (
              <div className="px-4 pb-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentKeys.length === 0 ? (
              <div className="px-4 pb-6 text-center text-muted-foreground text-sm pt-4">
                Belum ada key. <button onClick={() => setLocation("/keys")} className="text-primary underline">Buat sekarang</button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs text-foreground font-medium truncate">{key.keyString}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          <Smartphone className="w-3 h-3 inline mr-0.5" />
                          {key.deviceCount}/{key.maxDevices}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 shrink-0">
                      {key.status === "active" && <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">Active</Badge>}
                      {key.status === "banned" && <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-medium">Banned</Badge>}
                      {key.status === "expired" && <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">Expired</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Aktivitas Terbaru</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Log aktivitas sistem</p>
            </div>
            <button onClick={() => setLocation("/logs")} className="text-xs text-primary hover:underline font-medium">Lihat semua →</button>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="px-4 pb-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="px-4 pb-6 text-center text-muted-foreground text-sm pt-4">Belum ada aktivitas.</div>
            ) : (
              <div className="divide-y divide-border">
                {recentActivity.map((log) => {
                  const isSuccess = log.action.includes("success") || log.action.includes("valid") || log.action === "heartbeat";
                  const isError = log.action.includes("error") || log.action.includes("invalid") || log.action.includes("banned");
                  return (
                    <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isSuccess ? "bg-emerald-500" : isError ? "bg-red-500" : "bg-blue-500"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold capitalize ${isSuccess ? "text-emerald-700" : isError ? "text-red-700" : "text-blue-700"}`}>
                            {log.action}
                          </span>
                          {log.keyString && <span className="font-mono text-[10px] text-muted-foreground truncate">{log.keyString}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(log.timestamp), "dd MMM HH:mm")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>
        <div>
          <span className="text-sm font-medium text-foreground">System Operational</span>
          <span className="text-sm text-muted-foreground ml-2">— Semua layanan berjalan normal</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Live</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon, loading,
  accent = "text-foreground", badge, badgeLabel,
}: {
  title: string; value?: number; icon: React.ReactNode; loading: boolean;
  accent?: string; badge?: string; badgeLabel?: string;
}) {
  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-20" /> : (
          <div className="flex items-end justify-between">
            <div className={`text-3xl font-bold ${accent}`}>
              {value !== undefined ? value.toLocaleString() : "0"}
            </div>
            {badge && badgeLabel && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badge}`}>{badgeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
