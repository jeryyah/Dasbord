import { useEffect, useRef, useState } from "react";
import { useGetLogs } from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Radio, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

function getActionBadge(action: string) {
  const isSuccess =
    action.includes("success") ||
    action.includes("valid") ||
    action === "heartbeat" ||
    action === "device_activated" ||
    action === "key_generated" ||
    action === "key_unbanned";
  const isError =
    action.includes("error") ||
    action.includes("invalid") ||
    action.includes("banned") ||
    action.includes("limit") ||
    action === "key_deleted";

  if (isSuccess)
    return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 font-medium text-xs capitalize">{action}</Badge>;
  if (isError)
    return <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50 font-medium text-xs capitalize">{action}</Badge>;
  return <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 font-medium text-xs capitalize">{action}</Badge>;
}

export default function Logs() {
  const [isLive, setIsLive] = useState(true);
  const [newLogIds, setNewLogIds] = useState<Set<number>>(new Set());
  const prevIdsRef = useRef<Set<number>>(new Set());

  const { data, isLoading } = useGetLogs({
    query: {
      refetchInterval: isLive ? 3000 : false,
      refetchIntervalInBackground: false,
    },
  });

  useEffect(() => {
    if (!data?.logs) return;
    const currentIds = new Set(data.logs.map((l) => l.id));
    const incoming = new Set<number>();
    for (const id of currentIds) {
      if (!prevIdsRef.current.has(id)) incoming.add(id);
    }
    if (prevIdsRef.current.size > 0 && incoming.size > 0) {
      setNewLogIds(incoming);
      setTimeout(() => setNewLogIds(new Set()), 2500);
    }
    prevIdsRef.current = currentIds;
  }, [data]);

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Telemetri sistem & riwayat aktivitas lisensi secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Radio className="w-3 h-3" />
              <span className="font-semibold">Live</span>
            </div>
          )}
          <Button variant="outline" size="sm" className="border-border text-sm font-medium" onClick={() => setIsLive((v) => !v)}>
            {isLive ? <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</> : <><Play className="w-3.5 h-3.5 mr-1.5" /> Resume Live</>}
          </Button>
        </div>
      </div>

      {!isLoading && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-card border border-border rounded-lg text-sm text-muted-foreground">
          <span><strong className="text-foreground">{logs.length}</strong> entri terbaru</span>
          <span className="text-border">|</span>
          <span>Refresh: <strong className="text-foreground">{isLive ? "setiap 3 detik" : "dijeda"}</strong></span>
          <span className="text-border">|</span>
          <span><strong className="text-emerald-600">{logs.filter((l) => l.action === "device_activated").length}</strong> aktivasi</span>
          <span className="text-border">|</span>
          <span><strong className="text-blue-600">{logs.filter((l) => l.action === "key_generated").length}</strong> key dibuat</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-44">Timestamp</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key String</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Device ID</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-1/3">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ScrollText className="w-8 h-8 opacity-30" />
                    <span className="text-sm">Belum ada aktivitas yang tercatat.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const isNew = newLogIds.has(log.id);
                return (
                  <TableRow key={log.id} className={`border-border transition-colors duration-700 ${isNew ? "bg-emerald-50 hover:bg-emerald-50" : "hover:bg-muted/30"}`}>
                    <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isNew && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />}
                        {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="font-mono text-xs text-foreground font-medium">
                      {log.keyString || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.deviceId || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                      {log.detail || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLive && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground bg-muted/40 border border-dashed border-border rounded-lg">
          <Pause className="w-3.5 h-3.5" />
          Live update dijeda.{" "}
          <button onClick={() => setIsLive(true)} className="text-primary font-medium hover:underline">Klik untuk resume</button>
        </div>
      )}
    </div>
  );
}
