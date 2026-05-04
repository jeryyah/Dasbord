import { useState } from "react";
import {
  useGetKeys,
  useGenerateKey,
  useEditKey,
  useDeleteKey,
  useBanKey,
  useUnbanKey,
  useGetKeyDevices,
  useResetKeyDevices,
  getGetKeyDevicesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Key, Plus, Pencil, Trash2, Ban, ShieldCheck,
  Smartphone, RotateCcw, Copy, CopyCheck,
} from "lucide-react";

type KeyWithCount = {
  id: number; keyString: string; status: string;
  maxDevices: number; deviceCount: number; expiredDate: string; createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 font-medium text-xs">Active</Badge>;
  if (status === "banned") return <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50 font-medium text-xs">Banned</Badge>;
  return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 font-medium text-xs">Expired</Badge>;
}

function CopyKeyButton({ keyString }: { keyString: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded ml-1"
      onClick={() => { navigator.clipboard.writeText(keyString); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <CopyCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function Keys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetKeys();
  const generateMut = useGenerateKey();
  const editMut = useEditKey();
  const deleteMut = useDeleteKey();
  const banMut = useBanKey();
  const unbanMut = useUnbanKey();
  const resetMut = useResetKeyDevices();

  const [genOpen, setGenOpen] = useState(false);
  const [genDays, setGenDays] = useState("30");
  const [genMax, setGenMax] = useState("1");

  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState<KeyWithCount | null>(null);
  const [editMax, setEditMax] = useState("1");
  const [editDate, setEditDate] = useState("");

  const [devOpen, setDevOpen] = useState(false);
  const [devKeyId, setDevKeyId] = useState<number | null>(null);
  const [devKeyString, setDevKeyString] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KeyWithCount | null>(null);

  const safeDevKeyId = devKeyId !== null ? devKeyId : 0;
  const { data: devicesData, isLoading: devLoading } = useGetKeyDevices(
    safeDevKeyId,
    { query: { queryKey: getGetKeyDevicesQueryKey(safeDevKeyId), enabled: devKeyId !== null } }
  );

  const keys = data?.keys ?? [];

  function invalidateKeys() {
    queryClient.invalidateQueries({ queryKey: ["getKeys"] });
    queryClient.invalidateQueries({ queryKey: ["getStats"] });
  }

  function handleGenerate() {
    generateMut.mutate(
      { data: { days: parseInt(genDays), maxDevices: parseInt(genMax) } },
      {
        onSuccess: () => {
          setGenOpen(false);
          setGenDays("30"); setGenMax("1");
          invalidateKeys();
          toast({ title: "Key berhasil dibuat", description: "License key baru tersedia." });
        },
        onError: () => toast({ title: "Gagal", description: "Terjadi kesalahan saat generate key.", variant: "destructive" }),
      }
    );
  }

  function openEdit(key: KeyWithCount) {
    setEditKey(key);
    setEditMax(String(key.maxDevices));
    setEditDate(key.expiredDate);
    setEditOpen(true);
  }

  function handleEdit() {
    if (!editKey) return;
    editMut.mutate(
      { id: editKey.id, data: { maxDevices: parseInt(editMax), expiredDate: editDate } },
      {
        onSuccess: () => {
          setEditOpen(false);
          invalidateKeys();
          toast({ title: "Key diperbarui" });
        },
        onError: () => toast({ title: "Gagal update", variant: "destructive" }),
      }
    );
  }

  function handleBanToggle(key: KeyWithCount) {
    if (key.status === "banned") {
      unbanMut.mutate({ id: key.id }, {
        onSuccess: () => { invalidateKeys(); toast({ title: "Key di-unban" }); },
        onError: () => toast({ title: "Gagal", variant: "destructive" }),
      });
    } else {
      banMut.mutate({ id: key.id }, {
        onSuccess: () => { invalidateKeys(); toast({ title: "Key di-ban" }); },
        onError: () => toast({ title: "Gagal", variant: "destructive" }),
      });
    }
  }

  function confirmDelete(key: KeyWithCount) {
    setDeleteTarget(key);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMut.mutate({ id: deleteTarget.id }, {
      onSuccess: () => {
        setDeleteOpen(false);
        invalidateKeys();
        toast({ title: "Key dihapus" });
      },
      onError: () => toast({ title: "Gagal hapus", variant: "destructive" }),
    });
  }

  function openDevices(key: KeyWithCount) {
    setDevKeyId(key.id);
    setDevKeyString(key.keyString);
    setDevOpen(true);
  }

  function handleResetDevices() {
    if (devKeyId === null) return;
    resetMut.mutate({ id: devKeyId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getKeyDevices", devKeyId] });
        invalidateKeys();
        toast({ title: "Device direset", description: "Semua device dihapus dari key ini." });
      },
      onError: () => toast({ title: "Gagal reset", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">License Keys</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola seluruh license key untuk produk HEADSETTING.</p>
        </div>
        <Button onClick={() => setGenOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Generate Key
        </Button>
      </div>

      {!isLoading && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Total", count: keys.length, color: "text-foreground" },
            { label: "Active", count: keys.filter(k => k.status === "active").length, color: "text-emerald-600" },
            { label: "Expired", count: keys.filter(k => k.status === "expired").length, color: "text-amber-600" },
            { label: "Banned", count: keys.filter(k => k.status === "banned").length, color: "text-red-600" },
          ].map(s => (
            <div key={s.label} className="px-4 py-2 bg-card border border-border rounded-lg text-sm">
              <span className="text-muted-foreground">{s.label}: </span>
              <span className={`font-bold ${s.color}`}>{s.count}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
              {["#", "Key String", "Status", "Devices", "Expired", "Sisa Hari", "Actions"].map(h => (
                <TableHead key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Key className="w-8 h-8 opacity-30" />
                    <span className="text-sm">Belum ada license key. Klik "Generate Key" untuk mulai.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key, idx) => {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const expDate = parseISO(key.expiredDate);
                const daysLeft = differenceInDays(expDate, today);
                const isBusy = banMut.isPending || unbanMut.isPending || deleteMut.isPending;
                return (
                  <TableRow key={key.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm text-foreground font-semibold tracking-widest">{key.keyString}</span>
                        <CopyKeyButton keyString={key.keyString} />
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={key.status} /></TableCell>
                    <TableCell>
                      <button
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                        onClick={() => openDevices(key as KeyWithCount)}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span className={`font-medium ${key.deviceCount >= key.maxDevices ? "text-red-600" : "text-foreground"}`}>
                          {key.deviceCount}
                        </span>
                        <span className="text-muted-foreground">/ {key.maxDevices}</span>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(parseISO(key.expiredDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {key.status === "expired" || daysLeft < 0 ? (
                        <span className="text-xs text-amber-600 font-semibold">Expired</span>
                      ) : (
                        <span className={`text-xs font-semibold ${daysLeft <= 7 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-emerald-600"}`}>
                          {daysLeft}d
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Edit" onClick={() => openEdit(key as KeyWithCount)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className={`h-7 w-7 ${key.status === "banned" ? "text-emerald-600 hover:text-emerald-700" : "text-amber-500 hover:text-amber-600"}`} title={key.status === "banned" ? "Unban" : "Ban"} onClick={() => handleBanToggle(key as KeyWithCount)} disabled={isBusy}>
                          {key.status === "banned" ? <ShieldCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" title="Hapus" onClick={() => confirmDelete(key as KeyWithCount)} disabled={isBusy}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Generate License Key</DialogTitle>
            <DialogDescription className="text-muted-foreground">Buat license key baru dengan masa berlaku dan batas device.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Masa Berlaku (hari)</Label>
              <Input type="number" min="1" value={genDays} onChange={(e) => setGenDays(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Max Device</Label>
              <Input type="number" min="1" max="10" value={genMax} onChange={(e) => setGenMax(e.target.value)} className="bg-background border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)} className="border-border">Batal</Button>
            <Button onClick={handleGenerate} disabled={generateMut.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {generateMut.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Key — <span className="font-mono text-primary">{editKey?.keyString}</span></DialogTitle>
            <DialogDescription className="text-muted-foreground">Ubah batas device atau tanggal expired.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Max Device</Label>
              <Input type="number" min="1" max="10" value={editMax} onChange={(e) => setEditMax(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Tanggal Expired</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="bg-background border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="border-border">Batal</Button>
            <Button onClick={handleEdit} disabled={editMut.isPending} className="bg-primary hover:bg-primary/90 text-white">
              {editMut.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={devOpen} onOpenChange={(v) => { setDevOpen(v); if (!v) setDevKeyId(null); }}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Devices — <span className="font-mono text-primary">{devKeyString}</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {devicesData?.devices?.length ?? 0} device terdaftar.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {devLoading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !devicesData?.devices?.length ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Belum ada device terdaftar.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs font-semibold text-muted-foreground">Device ID</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Android</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground">Aktivasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devicesData.devices.map((d) => (
                    <TableRow key={d.id} className="border-border">
                      <TableCell className="font-mono text-xs text-foreground">{d.deviceId}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.deviceName || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.androidVersion || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(d.firstActivated), "dd MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleResetDevices} disabled={resetMut.isPending}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              {resetMut.isPending ? "Mereset..." : "Reset Semua Device"}
            </Button>
            <Button onClick={() => setDevOpen(false)} className="bg-primary hover:bg-primary/90 text-white">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Hapus Key?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Key <span className="font-mono font-semibold text-foreground">{deleteTarget?.keyString}</span> akan dihapus permanen beserta semua device yang terdaftar. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="border-border">Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMut.isPending} className="bg-destructive hover:bg-destructive/90">
              {deleteMut.isPending ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
