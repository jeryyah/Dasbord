import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clipboard, ClipboardCheck, BookOpen, ChevronDown, ChevronRight, Globe, Server } from "lucide-react";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface Endpoint {
  method: HttpMethod;
  path: string;
  description: string;
  auth?: boolean;
  params?: { name: string; in: string; required: boolean; desc: string }[];
  body?: Record<string, string>;
  response?: string;
}

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-blue-50 text-blue-700 border-blue-200",
  POST: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PUT: "bg-amber-50 text-amber-700 border-amber-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
};

const sections: { title: string; desc: string; endpoints: Endpoint[] }[] = [
  {
    title: "Public API",
    desc: "Endpoint bebas diakses dari script shell tanpa autentikasi admin.",
    endpoints: [
      {
        method: "GET",
        path: "/api/public/check",
        description: "Cek validitas key secara publik. Rate-limited 10 req/menit per IP.",
        params: [
          { name: "key", in: "query", required: true, desc: "License key string (6 karakter, uppercase)" },
          { name: "device_id", in: "query", required: false, desc: "ID unik device (IMEI, UUID, dll)" },
          { name: "device_name", in: "query", required: false, desc: "Nama device untuk display" },
          { name: "android_version", in: "query", required: false, desc: "Versi Android (mis. 12, 13)" },
        ],
        response: `{ "valid": true, "message": "Key valid", "key": "ABC123", "status": "active", "expiredDate": "2025-12-31", "maxDevices": 2 }`,
      },
      {
        method: "POST",
        path: "/api/public/activate",
        description: "Aktivasi device ke key. Rate-limited 10 req/menit per IP.",
        body: {
          key: "string (required) — License key",
          device_id: "string (required) — ID unik device",
          device_name: "string (optional) — Nama device",
          android_version: "string (optional) — Versi Android",
        },
        response: `{ "success": true, "message": "Aktivasi berhasil", "alreadyRegistered": false, "key": "ABC123", "expiredDate": "2025-12-31", "daysRemaining": 120, "maxDevices": 2, "deviceCount": 1 }`,
      },
    ],
  },
  {
    title: "Verify (Shell Script)",
    desc: "Endpoint untuk verifikasi di script shell. Mendukung aktivasi otomatis device.",
    endpoints: [
      {
        method: "POST",
        path: "/api/verify",
        description: "Verifikasi key dari script. Otomatis daftarkan device baru jika slot tersedia.",
        body: {
          key: "string (required) — License key",
          device_id: "string (optional) — ID unik device",
          device_name: "string (optional) — Nama device",
          android_version: "string (optional) — Versi Android",
        },
        response: `{ "status": "valid" | "expired" | "banned" | "device_limit" | "invalid", "expired_date": "2025-12-31" }`,
      },
      {
        method: "POST",
        path: "/api/verify/heartbeat",
        description: "Ping periodik dari script yang sedang berjalan untuk update lastCheckin.",
        body: {
          key: "string (required)",
          device_id: "string (required)",
          device_name: "string (optional)",
          android_version: "string (optional)",
        },
        response: `{ "status": "ok" | "expired" | "banned" | "invalid", "expired_date": "2025-12-31" }`,
      },
    ],
  },
  {
    title: "Admin — Keys",
    desc: "Manajemen license key. Memerlukan sesi admin (login terlebih dahulu).",
    endpoints: [
      { method: "GET", path: "/api/keys", description: "List semua license key beserta jumlah device.", auth: true, response: `{ "keys": [ { "id": 1, "keyString": "ABC123", "status": "active", "maxDevices": 2, "deviceCount": 1, "expiredDate": "2025-12-31", "createdAt": "..." } ] }` },
      { method: "POST", path: "/api/keys/generate", description: "Generate license key baru.", auth: true, body: { days: "integer — masa berlaku (hari)", maxDevices: "integer — maksimum device" }, response: `{ "id": 1, "keyString": "XYZ789", "status": "active", ... }` },
      { method: "PUT", path: "/api/keys/:id", description: "Edit batas device atau tanggal expired.", auth: true, body: { maxDevices: "integer", expiredDate: "string (YYYY-MM-DD)" }, response: `{ "id": 1, "keyString": "ABC123", "status": "active", "maxDevices": 3, "expiredDate": "2026-06-01", ... }` },
      { method: "DELETE", path: "/api/keys/:id", description: "Hapus license key beserta semua device-nya.", auth: true, response: `{ "success": true, "message": null }` },
      { method: "POST", path: "/api/keys/:id/ban", description: "Ban license key (status → banned).", auth: true, response: `{ ..., "status": "banned" }` },
      { method: "POST", path: "/api/keys/:id/unban", description: "Unban key kembali ke active.", auth: true, response: `{ ..., "status": "active" }` },
      { method: "GET", path: "/api/keys/:id/devices", description: "List device yang terdaftar pada key.", auth: true, response: `{ "devices": [ { "id": 1, "deviceId": "abc-123", "deviceName": "Redmi Note 12", "androidVersion": "13", "firstActivated": "...", "lastCheckin": "..." } ] }` },
      { method: "POST", path: "/api/keys/:id/devices/reset", description: "Reset semua device untuk key (slot kosong kembali).", auth: true, response: `{ "success": true, "message": null }` },
    ],
  },
  {
    title: "Admin — Logs & Stats",
    desc: "Melihat aktivitas dan statistik dashboard.",
    endpoints: [
      { method: "GET", path: "/api/stats", description: "Statistik global: total keys, active, expired, banned, devices, aktivasi hari ini.", auth: true, response: `{ "totalKeys": 25, "activeKeys": 18, "expiredKeys": 5, "bannedKeys": 2, "totalDevices": 40, "todayActivations": 3 }` },
      { method: "GET", path: "/api/logs", description: "200 aktivitas terbaru dari semua operasi.", auth: true, response: `{ "logs": [ { "id": 1, "action": "key_generated", "keyString": "ABC123", "deviceId": null, "detail": "...", "timestamp": "..." } ] }` },
    ],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Clipboard className="w-3.5 h-3.5" />}
    </button>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors text-left"
      >
        <Badge className={`border text-xs font-bold font-mono w-14 justify-center shrink-0 ${methodColors[endpoint.method]}`}>
          {endpoint.method}
        </Badge>
        <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
        {endpoint.auth && <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] ml-1">Auth</Badge>}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden md:block">{endpoint.description}</span>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          <p className="text-sm text-muted-foreground">{endpoint.description}</p>

          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Query Parameters</div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="pb-1.5 pr-3 font-medium">Name</th>
                    <th className="pb-1.5 pr-3 font-medium">In</th>
                    <th className="pb-1.5 pr-3 font-medium">Required</th>
                    <th className="pb-1.5 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map((p) => (
                    <tr key={p.name} className="border-b border-border/50">
                      <td className="py-1.5 pr-3 font-mono font-medium text-foreground">{p.name}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{p.in}</td>
                      <td className="py-1.5 pr-3">
                        {p.required ? <span className="text-red-600 font-semibold">Yes</span> : <span className="text-muted-foreground">No</span>}
                      </td>
                      <td className="py-1.5 text-muted-foreground">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {endpoint.body && (
            <div>
              <div className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Request Body (JSON)</div>
              <div className="bg-card border border-border rounded-lg p-3 space-y-1">
                {Object.entries(endpoint.body).map(([k, v]) => (
                  <div key={k} className="text-xs">
                    <span className="font-mono text-foreground font-medium">{k}</span>
                    <span className="text-muted-foreground ml-2">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endpoint.response && (
            <div>
              <div className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 flex items-center justify-between">
                <span>Example Response</span>
                <CopyButton text={endpoint.response} />
              </div>
              <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-3 text-xs overflow-x-auto font-mono leading-relaxed">
                {(() => { try { return JSON.stringify(JSON.parse(endpoint.response), null, 2); } catch { return endpoint.response; } })()}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApiDocs() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">API Documentation</h1>
        <p className="text-sm text-muted-foreground mt-1">Referensi lengkap endpoint HEADSETTING Key Manager API.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Base URL</div>
              <code className="text-xs font-mono text-muted-foreground">/api</code>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Server className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Auth</div>
              <div className="text-xs text-muted-foreground">Session cookie setelah <code className="font-mono">POST /api/admin/login</code></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {sections.map((section) => (
        <Card key={section.title} className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              {section.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{section.desc}</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {section.endpoints.map((ep) => (
              <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
