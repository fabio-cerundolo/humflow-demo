import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api, Candidate, Stats } from "../lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Humflow — Dashboard Talent Pipeline" },
      { name: "description", content: "Dashboard HR per analisi CV automatizzata con AI: pipeline candidati, skill matching e insight in tempo reale." },
      { property: "og:title", content: "Humflow — Dashboard Talent Pipeline" },
      { property: "og:description", content: "Dashboard HR per analisi CV automatizzata con AI: pipeline candidati, skill matching e insight in tempo reale." },
    ],
  }),
  component: AppContainer,
});

type Status = "Matchato" | "In Analisi" | "Nuovo" | "Scartato";
type Variant = "compact" | "extended" | "timeline";

interface PipelineCandidate {
  id: number;
  initials: string;
  name: string;
  role: string;
  status: Status;
  progress: 1 | 2 | 3 | 4;
  match?: number;
  when?: string;
  skills?: string[];
}

interface ArchiveRow {
  id: number;
  initials: string;
  name: string;
  role: string;
  status: Status;
  match: number;
  date: string;
  tags: string[];
  cv_file_path: string | null;
}

// Shared layout transition — smooth, expo-ish curve
const layoutTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 30,
  mass: 0.9,
};

const fadeTransition = { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const };

function StatusPill({ status }: { status: Status }) {
  const styles =
    status === "Matchato"
      ? "bg-emerald-mid text-white"
      : status === "In Analisi"
        ? "bg-gold/20 text-ink"
        : status === "Nuovo"
          ? "bg-ink/5 text-ink/40"
          : "bg-red-500/10 text-red-500";
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${styles}`}>
      {status}
    </span>
  );
}

function ProgressBars({ progress, status }: { progress: number; status: Status }) {
  const color =
    status === "Matchato" ? "bg-emerald-mid" : status === "In Analisi" ? "bg-gold" : status === "Nuovo" ? "bg-ink/10" : "bg-red-500";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full ${i <= progress ? color : "bg-canvas border border-ink/5"}`}
        />
      ))}
    </div>
  );
}

function KpiHero({ className = "", stats }: { className?: string; stats: Stats | null }) {
  const total = stats?.total_candidates ?? 0;
  const inAnalisi = stats?.status_distribution?.reviewed ?? 0;
  const matchati = stats?.status_distribution?.shortlisted ?? 0;
  const scartati = stats?.status_distribution?.rejected ?? 0;

  return (
    <motion.div
      layoutId="cell-kpi-hero"
      layout
      transition={layoutTransition}
      className={`bg-emerald-deep text-paper p-8 rounded-xl flex flex-col justify-between h-64 ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-gold text-xs font-bold uppercase tracking-widest">Totale Processati</p>
          <h1 className="font-display text-6xl font-bold">{total}</h1>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-[10px] font-mono">UP_TIME: 99.9%</p>
          <p className="text-emerald-mid font-bold text-sm">Aggiornato Live</p>
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-white/10 pt-6">
        <div className="border-r border-white/10">
          <p className="text-[10px] text-white/40 uppercase mb-1">In Analisi</p>
          <p className="text-xl font-display font-bold">{inAnalisi}</p>
        </div>
        <div className="px-6 border-r border-white/10">
          <p className="text-[10px] text-white/40 uppercase mb-1">Matchati</p>
          <p className="text-xl font-display font-bold">{matchati}</p>
        </div>
        <div className="px-6">
          <p className="text-[10px] text-white/40 uppercase mb-1">Scartati</p>
          <p className="text-xl font-display font-bold">{scartati}</p>
        </div>
      </div>
    </motion.div>
  );
}

function UploadCell({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const token = localStorage.getItem("token");

    setUploading(true);
    setError("");
    setSuccess(false);

    try {
      await api.uploadCv(token, file);
      setSuccess(true);
      onUploadSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Errore nel caricamento del CV");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      layoutId="cell-upload"
      layout
      transition={layoutTransition}
      onClick={() => document.getElementById("file-upload-input")?.click()}
      className="bg-surface border-2 border-dashed border-gold/30 hover:border-gold p-8 rounded-xl flex flex-col items-center justify-center text-center group transition-colors cursor-pointer relative"
    >
      <input
        type="file"
        id="file-upload-input"
        className="hidden"
        accept=".pdf,.docx"
        onChange={handleFileChange}
      />
      <div className="size-12 rounded-full bg-canvas flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
        {uploading ? (
          <div className="animate-spin rounded-full size-6 border-2 border-gold border-t-transparent" />
        ) : (
          <>
            <div className="w-0.5 h-4 bg-gold" />
            <div className="w-4 h-0.5 bg-gold absolute" />
          </>
        )}
      </div>
      <h3 className="font-display text-lg font-bold mb-1">
        {uploading ? "Analisi AI..." : "Upload CV"}
      </h3>
      <p className="text-xs text-ink/50 px-2">
        {success ? "✅ CV Caricato con successo!" : "Trascina i file PDF o DOCX qui per l'analisi AI"}
      </p>
      {error && <p className="text-[10px] text-red-500 mt-2 px-4">{error}</p>}
      <div className="mt-6 px-4 py-2 border border-gold text-gold text-[10px] font-bold uppercase tracking-widest">
        Seleziona File
      </div>
    </motion.div>
  );
}

function SkillsCell({ skills }: { skills: { name: string; count: number }[] }) {
  const maxCount = skills.length > 0 ? Math.max(...skills.map(s => s.count)) : 1;
  return (
    <motion.div
      layoutId="cell-skills"
      layout
      transition={layoutTransition}
      className="bg-surface p-8 rounded-xl border border-ink/5"
    >
      <h3 className="font-display text-sm font-bold uppercase tracking-widest mb-6">
        Skill più ricercate
      </h3>
      <div className="space-y-4">
        {skills.map((s) => {
          const pct = Math.round((s.count / maxCount) * 100);
          return (
            <div key={s.name}>
              <div className="flex justify-between text-xs mb-1">
                <span>{s.name}</span>
                <span className="font-mono opacity-60">{s.count} candidati</span>
              </div>
              <div className="h-1.5 w-full bg-canvas rounded-full overflow-hidden">
                <div className="h-full bg-emerald-mid" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {skills.length === 0 && (
          <p className="text-xs text-ink/50 text-center py-6">Nessuna skill rilevata nel DB</p>
        )}
      </div>
    </motion.div>
  );
}

function InsightCell({ className = "" }: { className?: string }) {
  return (
    <motion.div
      layoutId="cell-insight"
      layout
      transition={layoutTransition}
      className={`bg-canvas border border-ink/10 p-6 rounded-xl flex items-center gap-8 ${className}`}
    >
      <div className="shrink-0 w-48 h-24 bg-surface/50 rounded-lg grid place-items-center outline-1 -outline-offset-1 outline-ink/5">
        <svg viewBox="0 0 180 80" className="w-full h-full p-3" preserveAspectRatio="none">
          <polyline points="0,60 30,52 60,55 90,38 120,30 150,18 180,12" fill="none" stroke="#0d7a5f" strokeWidth="2" />
          <polyline points="0,70 30,68 60,62 90,58 120,50 150,46 180,40" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="font-display text-sm font-bold uppercase mb-2">Insight Settimanale</h4>
        <p className="text-xs text-ink/70 leading-relaxed">
          Il tempo medio di match è sceso del <span className="text-emerald-mid font-bold">18%</span>. La qualità dei candidati nel settore <span className="italic">Design</span> è in crescita costante.
        </p>
      </div>
    </motion.div>
  );
}

function PipelineCard({ c }: { c: PipelineCandidate }) {
  return (
    <motion.div
      layoutId={`candidate-${c.initials}-${c.id}`}
      layout
      transition={layoutTransition}
      className={`group bg-surface p-4 rounded-lg border border-ink/5 hover:border-gold/40 cursor-pointer ${
        c.status === "Nuovo" ? "opacity-60 hover:opacity-100" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="size-10 bg-canvas rounded-full flex items-center justify-center text-xs font-bold">
          {c.initials}
        </div>
        <StatusPill status={c.status} />
      </div>
      <h3 className="font-medium text-sm">{c.name}</h3>
      <p className="text-xs opacity-60 mb-3">{c.role}</p>
      <ProgressBars progress={c.progress} status={c.status} />
    </motion.div>
  );
}

function TimelineCard({ c, last }: { c: PipelineCandidate; last: boolean }) {
  return (
    <motion.li
      layoutId={`candidate-${c.initials}-${c.id}`}
      layout
      transition={layoutTransition}
      className="pl-6 relative list-none"
    >
      <span
        className={`absolute -left-[7px] top-1.5 size-3 rounded-full ring-4 ring-paper ${
          c.status === "Matchato"
            ? "bg-emerald-mid"
            : c.status === "In Analisi"
              ? "bg-gold"
              : c.status === "Nuovo"
                ? "bg-ink/30"
                : "bg-red-500"
        }`}
      />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-8 bg-canvas rounded-full flex items-center justify-center text-[10px] font-bold">
              {c.initials}
            </div>
            <div>
              <p className="font-medium text-sm leading-tight">{c.name}</p>
              <p className="text-[11px] opacity-60">{c.role}</p>
            </div>
          </div>
          {c.skills && (
            <div className="flex flex-wrap gap-1.5 mt-3 ml-11">
              {c.skills.map((s) => (
                <span
                  key={s}
                  className="text-[10px] font-mono px-2 py-0.5 bg-canvas rounded-sm border border-ink/5"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <StatusPill status={c.status} />
          <p className="text-[10px] font-mono opacity-50 mt-2">{c.when}</p>
          {c.match ? (
            <p className="text-sm font-display font-bold text-emerald-mid mt-1">{c.match}%</p>
          ) : null}
        </div>
      </div>
      {!last && <div className="ml-11 mt-4 border-t border-dashed border-ink/10" />}
    </motion.li>
  );
}

/* ---------------- VARIANT A: Compact Asymmetric ---------------- */
function CompactVariant({ pipelineData, onUploadSuccess, stats }: { pipelineData: PipelineCandidate[]; onUploadSuccess: () => void; stats: Stats | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <aside className="lg:col-span-4 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">Pipeline Attiva</h2>
          <span className="text-[10px] font-mono bg-ink/5 px-2 py-1">LIVE_FEED</span>
        </div>
        <motion.div layout className="space-y-3">
          {pipelineData.slice(0, 3).map((c) => (
            <PipelineCard key={c.id} c={c} />
          ))}
          {pipelineData.length === 0 && (
            <p className="text-xs text-ink/50 text-center py-6">Nessun candidato attivo</p>
          )}
        </motion.div>
      </aside>

      <main className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiHero className="md:col-span-2" stats={stats} />
        <UploadCell onUploadSuccess={onUploadSuccess} />
        <SkillsCell skills={stats?.skills_bar.slice(0, 4) || []} />
        <InsightCell className="md:col-span-2" />
      </main>
    </div>
  );
}

/* ---------------- VARIANT B: Extended Asymmetric ---------------- */
function ExtendedVariant({ pipelineData, onUploadSuccess, stats }: { pipelineData: PipelineCandidate[]; onUploadSuccess: () => void; stats: Stats | null }) {
  const tot = pipelineData.length || 1;
  const matches = pipelineData.filter(c => c.status === "Matchato").length;
  const analysis = pipelineData.filter(c => c.status === "In Analisi").length;
  const news = pipelineData.filter(c => c.status === "Nuovo").length;

  const matchPct = Math.round((matches / tot) * 100);
  const analysisPct = Math.round((analysis / tot) * 100);
  const newsPct = 100 - matchPct - analysisPct;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <aside className="lg:col-span-5 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest">Pipeline Estesa</h2>
          <span className="text-[10px] font-mono bg-ink/5 px-2 py-1">
            {pipelineData.length} CANDIDATI
          </span>
        </div>
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pipelineData.map((c) => (
            <PipelineCard key={c.id} c={c} />
          ))}
          {pipelineData.length === 0 && (
            <p className="text-xs text-ink/50 text-center py-6 col-span-2">Nessun candidato attivo</p>
          )}
        </motion.div>
        <motion.div
          layoutId="cell-distribution"
          layout
          transition={layoutTransition}
          className="bg-surface p-6 rounded-xl border border-ink/5"
        >
          <h3 className="font-display text-xs font-bold uppercase tracking-widest mb-4">
            Distribuzione Stati
          </h3>
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="bg-emerald-mid" style={{ width: `${matchPct}%` }} />
            <div className="bg-gold" style={{ width: `${analysisPct}%` }} />
            <div className="bg-ink/15" style={{ width: `${newsPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono mt-3 opacity-70">
            <span>Matchati {matchPct}%</span>
            <span>In analisi {analysisPct}%</span>
            <span>Nuovi {newsPct}%</span>
          </div>
        </motion.div>
      </aside>

      <main className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiHero className="md:col-span-2" stats={stats} />
        <UploadCell onUploadSuccess={onUploadSuccess} />
        <SkillsCell skills={stats?.skills_bar.slice(0, 4) || []} />
        <motion.div
          layoutId="cell-top-match"
          layout
          transition={layoutTransition}
          className="bg-surface p-6 rounded-xl border border-ink/5"
        >
          <h3 className="font-display text-sm font-bold uppercase tracking-widest mb-4">
            Top Match
          </h3>
          <div className="space-y-3">
            {pipelineData
              .filter((c) => c.status === "Matchato")
              .slice(0, 4)
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 bg-canvas rounded-full flex items-center justify-center text-[10px] font-bold">
                      {c.initials}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{c.name}</p>
                      <p className="text-[10px] opacity-50">{c.role}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-emerald-mid font-bold">{c.match}%</span>
                </div>
              ))}
            {pipelineData.filter(c => c.status === "Matchato").length === 0 && (
              <p className="text-xs text-ink/50 text-center py-4">Nessun match al 100%</p>
            )}
          </div>
        </motion.div>
        <InsightCell className="md:col-span-2" />
      </main>
    </div>
  );
}

/* ---------------- VARIANT C: Timeline ---------------- */
function TimelineVariant({ pipelineData, onUploadSuccess, stats }: { pipelineData: PipelineCandidate[]; onUploadSuccess: () => void; stats: Stats | null }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <main className="lg:col-span-8 space-y-6">
        <KpiHero stats={stats} />

        <motion.div
          layoutId="cell-timeline-wrapper"
          layout
          transition={layoutTransition}
          className="bg-surface p-8 rounded-xl border border-ink/5"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest">
              Timeline Pipeline
            </h2>
            <span className="text-[10px] font-mono bg-ink/5 px-2 py-1">CRONOLOGIA</span>
          </div>
          <motion.ol layout className="relative border-l border-ink/10 ml-3 space-y-8">
            {pipelineData.map((c, i) => (
              <TimelineCard key={c.id} c={c} last={i === pipelineData.length - 1} />
            ))}
            {pipelineData.length === 0 && (
              <p className="text-xs text-ink/50 text-center py-6">Nessun candidato in timeline</p>
            )}
          </motion.ol>
        </motion.div>
      </main>

      <aside className="lg:col-span-4 space-y-6">
        <UploadCell onUploadSuccess={onUploadSuccess} />
        <SkillsCell skills={stats?.skills_bar.slice(0, 4) || []} />
      </aside>
    </div>
  );
}

/* ---------------- Variant switcher ---------------- */
const VARIANTS: { id: Variant; label: string; hint: string }[] = [
  { id: "compact", label: "Compatta", hint: "Asimmetrica · Bento" },
  { id: "extended", label: "Estesa", hint: "Asimmetrica · Dual-pane" },
  { id: "timeline", label: "Timeline", hint: "Cronologia verticale" },
];

/* ---------------- ARCHIVIO ---------------- */
function ArchiveSection({
  rows,
  onDelete,
  onStatusChange,
  onDownload,
}: {
  rows: ArchiveRow[];
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onDownload: (id: number, name: string) => Promise<void>;
}) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<{ id: number; msg: string } | null>(null);

  const handleDownload = async (id: number, name: string) => {
    setDownloadingId(id);
    setDownloadError(null);
    try {
      await onDownload(id, name);
    } catch (err: any) {
      setDownloadError({ id, msg: err.message || 'Errore download' });
      setTimeout(() => setDownloadError(null), 4000);
    } finally {
      setDownloadingId(null);
    }
  };
  const [filter, setFilter] = useState<"Tutti" | Status>("Tutti");
  const filters: Array<"Tutti" | Status> = ["Tutti", "Matchato", "In Analisi", "Nuovo", "Scartato"];
  const filteredRows = filter === "Tutti" ? rows : rows.filter((r) => r.status === filter);

  return (
    <section id="archivio" className="mt-24 scroll-mt-10 animate-in">
      <header className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-1">
            Storico · Database Realtime
          </p>
          <h2 className="font-display text-3xl font-bold">Archivio candidati</h2>
        </div>
        <div className="flex gap-1 p-1 bg-surface border border-ink/10 rounded-lg">
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[11px] font-display font-bold uppercase tracking-wider rounded-md transition-colors ${
                  active ? "bg-emerald-deep text-paper" : "text-ink/60 hover:text-ink"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </header>

      <div className="bg-surface rounded-xl border border-ink/5 overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-ink/50 border-b border-ink/5 bg-canvas">
          <div className="col-span-3">Candidato</div>
          <div className="col-span-3">Ruolo</div>
          <div className="col-span-2">Stato</div>
          <div className="col-span-1 text-right">Match</div>
          <div className="col-span-1 text-right">Data</div>
          <div className="col-span-2 text-right">Azioni</div>
        </div>
        {filteredRows.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-12 px-6 py-4 items-center border-b border-ink/5 last:border-0 hover:bg-canvas/60 transition-colors"
          >
            <div className="col-span-3 flex items-center gap-3">
              <div className="size-9 bg-canvas rounded-full flex items-center justify-center text-[11px] font-bold">
                {r.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <div className="flex gap-1.5 mt-1">
                  {r.tags.map((t) => (
                    <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 bg-canvas rounded-sm border border-ink/5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-3 text-xs opacity-70">{r.role}</div>
            <div className="col-span-2">
              <StatusPill status={r.status} />
            </div>
            <div className="col-span-1 text-right font-mono text-sm">
              {r.match ? <span className={r.match >= 60 ? "text-emerald-mid font-bold" : ""}>{r.match}%</span> : <span className="opacity-30">—</span>}
            </div>
            <div className="col-span-1 text-right text-[11px] font-mono opacity-60">{r.date}</div>

            {/* Azioni GDPR ed Aggiornamento Stato */}
            <div className="col-span-2 text-right flex items-center justify-end gap-1.5 flex-wrap">
              <select
                value={r.status === 'Nuovo' ? 'new' : r.status === 'In Analisi' ? 'reviewed' : r.status === 'Matchato' ? 'shortlisted' : 'rejected'}
                onChange={(e) => onStatusChange(r.id, e.target.value)}
                className="bg-canvas border border-ink/10 rounded px-1.5 py-1 text-[10px] focus:outline-none dark:text-white"
              >
                <option value="new">Nuovo</option>
                <option value="reviewed">In Analisi</option>
                <option value="shortlisted">Matchato</option>
                <option value="rejected">Scartato</option>
              </select>

              {/* Pulsante Download CV */}
              {r.cv_file_path ? (
                <button
                  onClick={() => handleDownload(r.id, r.name)}
                  disabled={downloadingId === r.id}
                  title={downloadError?.id === r.id ? downloadError.msg : 'Scarica CV'}
                  className={`text-[10px] font-mono px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                    downloadError?.id === r.id
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-emerald-mid/10 text-emerald-mid hover:bg-emerald-mid/20'
                  } ${downloadingId === r.id ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {downloadingId === r.id ? (
                    <span className="inline-block animate-spin">⟳</span>
                  ) : downloadError?.id === r.id ? (
                    '✗ Err'
                  ) : (
                    '↓ CV'
                  )}
                </button>
              ) : (
                <span className="text-[10px] font-mono text-ink/20 px-2 py-1">No CV</span>
              )}

              <button
                onClick={() => onDelete(r.id)}
                className="text-[10px] font-mono bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-1 rounded transition-colors"
                title="Elimina per GDPR"
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
        {filteredRows.length === 0 && (
          <p className="text-xs text-ink/50 text-center py-12">Nessun candidato registrato</p>
        )}
      </div>
    </section>
  );
}

/* ---------------- NUOVA RICERCA ---------------- */
function NewSearchSection({ onSearchTrigger }: { onSearchTrigger: (skills: string[]) => void }) {
  const [skillsSelected, setSkillsSelected] = useState<string[]>(["Figma", "Design Systems", "Research"]);
  const [inputVal, setInputVal] = useState("");

  const handleAddSkill = () => {
    if (inputVal.trim() && !skillsSelected.includes(inputVal.trim())) {
      setSkillsSelected([...skillsSelected, inputVal.trim()]);
      setInputVal("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkillsSelected(skillsSelected.filter(s => s !== skill));
  };

  return (
    <section id="nuova-ricerca" className="mt-24 scroll-mt-10 animate-in">
      <header className="mb-8">
        <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-1">
          Brief · AI matching
        </p>
        <h2 className="font-display text-3xl font-bold">Nuova ricerca</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-surface p-8 rounded-xl border border-ink/5 space-y-6">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Ruolo</label>
            <input
              defaultValue="Senior Product Designer"
              className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 font-display text-lg focus:outline-none focus:border-gold dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Seniority</label>
              <select className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold dark:text-white">
                <option>Senior</option>
                <option>Mid</option>
                <option>Junior</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Sede</label>
              <select className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold dark:text-white">
                <option>Remoto · EU</option>
                <option>Milano</option>
                <option>Roma</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Skill richieste</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {skillsSelected.map((s) => (
                <span
                  key={s}
                  onClick={() => handleRemoveSkill(s)}
                  className="px-3 py-1.5 bg-emerald-deep text-paper rounded-full text-[11px] font-mono cursor-pointer hover:bg-red-500/20"
                >
                  {s} ×
                </span>
              ))}
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  placeholder="Aggiungi skill"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  className="bg-canvas border border-ink/10 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-gold dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="text-xs font-bold text-gold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Note brief</label>
            <textarea
              rows={4}
              defaultValue="Cerco un designer con esperienza B2B SaaS, sensibilità verso research e capacità di scaling di design system."
              className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => onSearchTrigger(skillsSelected)}
              className="px-6 py-3 bg-gold text-ink rounded-sm font-display text-xs font-bold uppercase tracking-widest hover:bg-gold/90 transition-colors w-full"
            >
              Avvia matching AI nel Database
            </button>
          </div>
        </div>

        <aside className="lg:col-span-5 space-y-6">
          <div className="bg-emerald-deep text-paper p-8 rounded-xl">
            <p className="text-gold text-[10px] font-bold uppercase tracking-widest mb-3">
              Anteprima match
            </p>
            <p className="font-display text-5xl font-bold">Analisi Realtime</p>
            <p className="text-white/60 text-xs mt-2">I candidati compatibili verranno filtrati in archivio</p>
            <div className="border-t border-white/10 mt-6 pt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-white/40 text-[10px] uppercase mb-1">Match medio</p>
                <p className="font-display text-lg font-bold">82%</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] uppercase mb-1">Tempo stimato</p>
                <p className="font-display text-lg font-bold">Instantaneo</p>
              </div>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-xl border border-ink/5">
            <h3 className="font-display text-xs font-bold uppercase tracking-widest mb-4">Suggerimenti AI</h3>
            <ul className="space-y-3 text-xs">
              <li className="flex gap-2"><span className="text-gold">→</span> Filtra per skill per isolare i candidati in tempo reale.</li>
              <li className="flex gap-2"><span className="text-gold">→</span> I CV caricati vengono scansionati automaticamente con Llama 3.3.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ---------------- INTEGRATED SUPPLEMENTARY VIEWS ---------------- */

// 1. SkillGapView
function SkillGapView({ candidates }: { candidates: Candidate[] }) {
  const [skills, setSkills] = useState<{ name: string; target: number }[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("skill_gap_targets");
      return saved ? JSON.parse(saved) : [
        { name: "Python", target: 8 },
        { name: "React", target: 6 },
        { name: "TypeScript", target: 5 },
        { name: "AWS", target: 4 },
        { name: "Leadership", target: 3 },
      ];
    }
    return [];
  });

  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState(5);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState(5);

  useEffect(() => {
    localStorage.setItem("skill_gap_targets", JSON.stringify(skills));
  }, [skills]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (skills.some(s => s.name.toLowerCase() === newName.trim().toLowerCase())) {
      alert("Competenza già esistente");
      return;
    }
    setSkills([...skills, { name: newName.trim(), target: newTarget }]);
    setNewName("");
    setNewTarget(5);
  };

  const handleRemove = (name: string) => {
    setSkills(skills.filter(s => s.name !== name));
  };

  const handleStartEdit = (name: string) => {
    const s = skills.find(sk => sk.name === name);
    if (s) {
      setEditingName(name);
      setEditingTarget(s.target);
    }
  };

  const handleSaveEdit = () => {
    setSkills(skills.map(s => s.name === editingName ? { ...s, target: editingTarget } : s));
    setEditingName(null);
  };

  return (
    <div className="space-y-8 animate-in mt-10">
      <header className="mb-4">
        <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-1">
          Analisi Gap · Obiettivi
        </p>
        <h2 className="font-display text-3xl font-bold">Skill Gap Recruiting</h2>
      </header>

      <div className="bg-surface p-8 rounded-xl border border-ink/5 space-y-6">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest">Aggiungi Obiettivo Recruiting</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Competenza</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Es. Docker, Go, Kubernetes..."
              className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold dark:text-white"
            />
          </div>
          <div className="w-full md:w-32">
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Target Candidati</label>
            <input
              type="number"
              min="1"
              value={newTarget}
              onChange={(e) => setNewTarget(Number(e.target.value))}
              className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold dark:text-white"
            />
          </div>
          <button
            onClick={handleAdd}
            className="px-6 py-3.5 bg-gold text-ink rounded-sm font-display text-xs font-bold uppercase tracking-widest hover:bg-gold/90 transition-colors w-full md:w-auto"
          >
            Aggiungi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skills.map((skill) => {
          const actual = candidates.filter(c =>
            c.skills?.some(s => s.toLowerCase() === skill.name.toLowerCase())
          ).length;
          const pct = skill.target > 0 ? Math.min(100, (actual / skill.target) * 100) : 0;
          const gap = skill.target - actual;

          return (
            <div key={skill.name} className="bg-surface p-6 rounded-xl border border-ink/5 flex flex-col justify-between group relative hover:border-gold/40 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-display font-bold text-lg">{skill.name}</h4>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleStartEdit(skill.name)}
                    className="text-xs font-mono bg-ink/5 hover:bg-gold/20 hover:text-gold px-2 py-1 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemove(skill.name)}
                    className="text-xs font-mono bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-1 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingName === skill.name ? (
                <div className="bg-canvas p-4 rounded border border-ink/10 space-y-3">
                  <label className="text-[10px] font-mono uppercase opacity-60">Nuovo Target</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editingTarget}
                      onChange={(e) => setEditingTarget(Number(e.target.value))}
                      className="flex-1 bg-surface border border-ink/15 rounded px-2 py-1.5 text-sm dark:text-white"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="bg-emerald-deep text-paper text-xs px-3 py-1.5 font-bold uppercase tracking-wider"
                    >
                      Salva
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between text-xs font-mono opacity-80">
                    <span>Target: {skill.target}</span>
                    <span>Rilevati: {actual}</span>
                  </div>

                  <div className="h-2 w-full bg-canvas rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pct >= 100 ? "bg-emerald-mid" : pct >= 50 ? "bg-gold" : "bg-red-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {gap > 0 ? (
                    <div className="bg-red-500/5 text-red-500 text-[10px] font-mono uppercase px-2 py-1.5 border border-red-500/10 text-center">
                      Mancano {gap} candidati
                    </div>
                  ) : (
                    <div className="bg-emerald-mid/5 text-emerald-mid text-[10px] font-mono uppercase px-2 py-1.5 border border-emerald-mid/10 text-center">
                      Obiettivo Raggiunto!
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. CalendarView
interface Interview {
  id: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  date: string;
  time: string;
  type: string;
}

function CalendarView({ candidates }: { candidates: Candidate[] }) {
  const [interviews, setInterviews] = useState<Interview[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("scheduled_interviews");
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: 1, candidateId: 1, candidateName: "Alessandro Martini", candidateEmail: "a.martini@example.com", date: "2026-06-18", time: "Oggi, 15:30", type: "Colloquio tecnico" },
      { id: 2, candidateId: 2, candidateName: "Giulia Serra", candidateEmail: "g.serra@example.com", date: "2026-06-19", time: "Domani, 10:00", type: "Colloquio HR" },
    ];
  });

  const [form, setForm] = useState({
    candidateId: "",
    date: "",
    time: "",
    type: "Colloquio tecnico",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("scheduled_interviews", JSON.stringify(interviews));
  }, [interviews]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.candidateId || !form.date || !form.time) {
      setError("Compila tutti i campi richiesti.");
      return;
    }

    const candidate = candidates.find(c => c.id === Number(form.candidateId));
    if (!candidate) {
      setError("Candidato non trovato.");
      return;
    }

    const newInterview: Interview = {
      id: Date.now(),
      candidateId: candidate.id,
      candidateName: candidate.name || candidate.email.split('@')[0],
      candidateEmail: candidate.email,
      date: form.date,
      time: `${form.date} ore ${form.time}`,
      type: form.type,
    };

    setInterviews([newInterview, ...interviews]);
    setForm({ candidateId: "", date: "", time: "", type: "Colloquio tecnico" });
  };

  const handleCancel = (id: number) => {
    if (confirm("Sei sicuro di voler annullare questo colloquio?")) {
      setInterviews(interviews.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in mt-10">
      <header className="mb-4">
        <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-1">
          Pianificazione · Calendario
        </p>
        <h2 className="font-display text-3xl font-bold">Calendario Colloqui</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-surface p-8 rounded-xl border border-ink/5 space-y-6 h-fit">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest">Pianifica Nuovo Colloquio</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Seleziona Candidato</label>
              <select
                value={form.candidateId}
                onChange={(e) => setForm({ ...form, candidateId: e.target.value })}
                className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold dark:text-white"
                required
              >
                <option value="">-- Seleziona --</option>
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Data</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Ora</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Tipo Colloquio</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold dark:text-white"
              >
                <option>Colloquio tecnico</option>
                <option>Colloquio HR</option>
                <option>System Architecture Review</option>
                <option>Offerta e Negoziazione</option>
              </select>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-mono">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-deep text-paper rounded-sm font-display text-xs font-bold uppercase tracking-widest hover:bg-emerald-mid transition-colors"
            >
              Conferma e Invia Invito
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-surface p-8 rounded-xl border border-ink/5 space-y-6">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest">Colloqui in Programma ({interviews.length})</h3>
          <div className="space-y-4">
            {interviews.map(i => (
              <div key={i.id} className="bg-canvas border border-ink/5 p-5 rounded-lg flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest bg-gold/15 text-gold px-2 py-0.5 rounded-sm">
                    {i.type}
                  </span>
                  <h4 className="font-medium text-sm mt-1">{i.candidateName}</h4>
                  <p className="text-xs opacity-60">{i.candidateEmail}</p>
                  <p className="text-xs font-mono text-emerald-mid mt-2">{i.time}</p>
                </div>
                <button
                  onClick={() => handleCancel(i.id)}
                  className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors"
                >
                  Annulla
                </button>
              </div>
            ))}
            {interviews.length === 0 && (
              <p className="text-xs text-ink/50 text-center py-12">Nessun colloquio programmato.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. ReportsView
function ReportsView({ stats }: { stats: Stats | null }) {
  if (!stats) return <p className="text-xs text-ink/50 py-12 text-center">Caricamento report...</p>;

  const COLORS = ["#2563eb", "#0d7a5f", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-8 animate-in mt-10">
      <header className="mb-4">
        <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-1">
          Analytics · Insight
        </p>
        <h2 className="font-display text-3xl font-bold">Reportistica HR</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface p-8 rounded-xl border border-ink/5 space-y-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest">Distribuzione Skill (Top 10)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.skills_bar}>
                <XAxis dataKey="name" stroke="currentColor" className="opacity-50 text-[10px]" />
                <YAxis stroke="currentColor" className="opacity-50 text-[10px]" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink)" }}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface p-8 rounded-xl border border-ink/5 space-y-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest">Stato dei Candidati</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.status_pie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.status_pie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. GdprView
function GdprView({ onCleanSuccess }: { onCleanSuccess: () => void }) {
  const [cleaning, setCleaning] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClean = async () => {
    if (!confirm("ATTENZIONE! Questa operazione cancellerà permanentemente tutti i candidati e le skill dal database. Questa operazione rispetta la conformità GDPR ed è irreversibile. Vuoi procedere?")) {
      return;
    }

    setCleaning(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      await api.deleteAllCandidates(token);
      setSuccess(true);
      onCleanSuccess();
    } catch (err: any) {
      alert(err.message || "Errore durante la sanificazione dei dati");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in mt-10">
      <header className="mb-4">
        <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-1">
          Compliance · Sicurezza
        </p>
        <h2 className="font-display text-3xl font-bold">Gestione Privacy GDPR</h2>
      </header>

      <div className="bg-surface p-8 rounded-xl border border-ink/5 space-y-6 max-w-2xl">
        <h3 className="font-display text-lg font-bold text-red-500 uppercase tracking-wider">Rimozione Totale dei Dati</h3>
        <p className="text-xs text-ink/70 leading-relaxed">
          In conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR - Regolamento UE 2016/679), in particolare riguardo al "Diritto all'Oblio" (Articolo 17), questa sezione consente di eseguire un "purge" totale di tutte le informazioni personali dei candidati memorizzate nel sistema.
        </p>
        <div className="bg-red-500/5 border border-red-500/10 p-4 rounded text-xs text-red-500 space-y-2">
          <p className="font-bold">⚠️ ATTENZIONE:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tutti i file dei CV caricati nel sistema saranno permanentemente rimossi dal server.</li>
            <li>Tutti i record nel database PostgreSQL relativi a candidati e skill saranno eliminati.</li>
            <li>Questa azione NON è annullabile.</li>
          </ul>
        </div>

        <button
          onClick={handleClean}
          disabled={cleaning}
          className="px-6 py-3 bg-red-600 text-white rounded-sm font-display text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {cleaning ? "Eliminazione..." : "Esegui Purge Conformità GDPR"}
        </button>

        {success && (
          <p className="text-xs text-emerald-mid font-mono font-bold">✅ Database sanificato con successo secondo i requisiti GDPR.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- MAIN CONTAINER ---------------- */
function AppContainer() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // App States
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // "dashboard", "skillgap", "calendar", "reports", "gdpr"
  const [searchSkillFilter, setSearchSkillFilter] = useState<string[]>([]);

  // UI Theme states
  const [dark, setDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCandidates([]);
    setStats(null);
  };

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [candidatesData, statsData] = await Promise.all([
        api.getCandidates(token),
        api.getStats(token)
      ]);
      setCandidates(candidatesData);
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Impossibile caricare")) {
        // Probabilmente token scaduto
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const data = await api.login(username, password);
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
    } catch (err: any) {
      setLoginError(err.message || "Credenziali non valide");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.updateStatus(token, id, status);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Impossibile aggiornare lo stato");
    }
  };

  const handleDeleteCandidate = async (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questo candidato per motivi GDPR?")) {
      try {
        await api.deleteCandidate(token, id);
        await loadData();
      } catch (err: any) {
        alert(err.message || "Impossibile eliminare il candidato");
      }
    }
  };

  const handleBriefSearchTrigger = (skills: string[]) => {
    setSearchSkillFilter(skills);
    setTimeout(() => {
      document.getElementById("archivio")?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Mappers
  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "CN";
  };

  const getRoleFromSkills = (skills: string[] = []): string => {
    const skillsLower = skills.map(s => s.toLowerCase());
    if (skillsLower.includes("figma") || skillsLower.includes("adobe xd") || skillsLower.includes("sketch") || skillsLower.includes("ux") || skillsLower.includes("ui")) {
      return "Product Designer";
    }
    if (skillsLower.includes("react") || skillsLower.includes("next.js") || skillsLower.includes("typescript") || skillsLower.includes("angular") || skillsLower.includes("vue.js")) {
      return "Frontend Engineer";
    }
    if (skillsLower.includes("python") || skillsLower.includes("pytorch") || skillsLower.includes("tensorflow") || skillsLower.includes("mlops") || skillsLower.includes("pandas")) {
      return "Data Scientist / AI Specialist";
    }
    if (skillsLower.includes("go") || skillsLower.includes("rust") || skillsLower.includes("kafka") || skillsLower.includes("node.js") || skillsLower.includes("django")) {
      return "Backend Engineer";
    }
    if (skillsLower.includes("docker") || skillsLower.includes("kubernetes") || skillsLower.includes("aws") || skillsLower.includes("terraform") || skillsLower.includes("devops")) {
      return "DevOps Engineer";
    }
    if (skills.length > 0) {
      return `${skills[0]} Specialist`;
    }
    return "Specialista HR";
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}m fa`;
      if (diffHours < 24) return `${diffHours}h fa`;
      return `${diffDays}g fa`;
    } catch {
      return "poco fa";
    }
  };

  const REQUIRED_SKILLS = ["python", "react", "typescript", "aws", "leadership"];
  
  const mappedPipeline: PipelineCandidate[] = candidates
    .filter(c => c.status !== 'rejected')
    .map(c => {
      const matches = c.skills ? c.skills.filter(s => REQUIRED_SKILLS.includes(s.toLowerCase())) : [];
      const match = REQUIRED_SKILLS.length > 0 ? Math.round((matches.length / REQUIRED_SKILLS.length) * 100) : 0;
      return {
        id: c.id,
        initials: getInitials(c.name, c.email),
        name: c.name || c.email.split('@')[0],
        role: getRoleFromSkills(c.skills),
        status: c.status === 'new' ? 'Nuovo' : c.status === 'reviewed' ? 'In Analisi' : 'Matchato',
        progress: c.status === 'new' ? 1 : c.status === 'reviewed' ? 2 : c.status === 'shortlisted' ? 3 : 4,
        match: match,
        when: formatRelativeTime(c.created_at),
        skills: c.skills || [],
      };
    });

  const filteredArchiveCandidates = candidates.filter(c => {
    if (searchSkillFilter.length === 0) return true;
    return searchSkillFilter.every(skillName => 
      c.skills?.some(s => s.toLowerCase() === skillName.toLowerCase())
    );
  });

  const mappedArchive: ArchiveRow[] = filteredArchiveCandidates.map(c => {
    const matches = c.skills ? c.skills.filter(s => REQUIRED_SKILLS.includes(s.toLowerCase())) : [];
    const match = REQUIRED_SKILLS.length > 0 ? Math.round((matches.length / REQUIRED_SKILLS.length) * 100) : 0;
    return {
      id: c.id,
      initials: getInitials(c.name, c.email),
      name: c.name || c.email.split('@')[0],
      role: getRoleFromSkills(c.skills),
      status: c.status === 'new' ? 'Nuovo' : c.status === 'reviewed' ? 'In Analisi' : c.status === 'shortlisted' ? 'Matchato' : 'Scartato',
      match: match,
      date: new Date(c.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
      tags: c.skills ? c.skills.slice(0, 3) : [],
    };
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-6 transition-colors">
        <div className="w-full max-w-md bg-surface border border-ink/5 p-8 rounded-xl shadow-lg relative overflow-hidden animate-in">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="size-12 bg-emerald-deep flex items-center justify-center rounded-sm mb-3">
              <div className="size-4 border-2 border-gold rotate-45" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight uppercase">Humflow</span>
            <p className="text-[10px] font-mono uppercase tracking-widest text-ink/40 mt-1">
              v0.3 · Talent Pipeline AI
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold dark:text-white"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest opacity-60">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full bg-canvas border border-ink/10 rounded-md px-4 py-3 text-sm focus:outline-none focus:border-gold dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-md">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-emerald-deep text-paper rounded-sm font-display text-xs font-bold uppercase tracking-widest hover:bg-emerald-mid transition-colors disabled:opacity-50"
            >
              {loginLoading ? "Connessione..." : "Accedi"}
            </button>
          </form>

          <footer className="mt-8 pt-4 border-t border-ink/5 text-center text-[10px] font-mono opacity-40 uppercase tracking-widest">
            Credenziali demo: admin / password
          </footer>
        </div>
      </div>
    );
  }

  return (
    <Dashboard 
      candidates={candidates}
      stats={stats}
      loading={loading}
      view={view}
      setView={setView}
      pipelineData={mappedPipeline}
      archiveData={mappedArchive}
      dark={dark}
      setDark={setDark}
      onLogout={handleLogout}
      onUploadSuccess={loadData}
      onDeleteCandidate={handleDeleteCandidate}
      onStatusChange={handleStatusChange}
      onBriefSearch={handleBriefSearchTrigger}
    />
  );
}

/* ---------------- DASHBOARD COMPONENT ---------------- */
function Dashboard({
  candidates,
  stats,
  loading,
  view,
  setView,
  pipelineData,
  archiveData,
  dark,
  setDark,
  onLogout,
  onUploadSuccess,
  onDeleteCandidate,
  onStatusChange,
  onBriefSearch,
}: {
  candidates: Candidate[];
  stats: Stats | null;
  loading: boolean;
  view: string;
  setView: (v: string) => void;
  pipelineData: PipelineCandidate[];
  archiveData: ArchiveRow[];
  dark: boolean;
  setDark: (v: boolean | ((d: boolean) => boolean)) => void;
  onLogout: () => void;
  onUploadSuccess: () => void;
  onDeleteCandidate: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onBriefSearch: (skills: string[]) => void;
}) {
  const [variant, setVariant] = useState<Variant>("compact");

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans selection:bg-gold/30 p-6 lg:p-10 transition-colors">
      <nav className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-emerald-deep flex items-center justify-center rounded-sm">
            <div className="size-3 border-2 border-gold rotate-45" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight uppercase">Humflow</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <button 
            onClick={() => { setView("dashboard"); setTimeout(() => document.getElementById("dashboard")?.scrollIntoView({ behavior: 'smooth' }), 50); }}
            className={`hover:opacity-60 transition-opacity ${view === "dashboard" ? "font-bold text-emerald-mid" : "opacity-60"}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => { setView("dashboard"); setTimeout(() => document.getElementById("archivio")?.scrollIntoView({ behavior: 'smooth' }), 50); }}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            Archivio
          </button>
          <button 
            onClick={() => { setView("dashboard"); setTimeout(() => document.getElementById("nuova-ricerca")?.scrollIntoView({ behavior: 'smooth' }), 50); }}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            Nuova Ricerca
          </button>
          <button 
            onClick={() => setView("skillgap")}
            className={`hover:opacity-60 transition-opacity ${view === "skillgap" ? "font-bold text-emerald-mid" : "opacity-60"}`}
          >
            Skill Gap
          </button>
          <button 
            onClick={() => setView("reports")}
            className={`hover:opacity-60 transition-opacity ${view === "reports" ? "font-bold text-emerald-mid" : "opacity-60"}`}
          >
            Report
          </button>
          <button 
            onClick={() => setView("calendar")}
            className={`hover:opacity-60 transition-opacity ${view === "calendar" ? "font-bold text-emerald-mid" : "opacity-60"}`}
          >
            Colloqui
          </button>
          <button 
            onClick={() => setView("gdpr")}
            className={`hover:opacity-60 transition-opacity ${view === "gdpr" ? "font-bold text-emerald-mid" : "opacity-60"}`}
          >
            Privacy
          </button>
          
          <div className="h-4 w-px bg-ink/10" />
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Attiva tema chiaro" : "Attiva tema scuro"}
            className="size-9 grid place-items-center rounded-sm border border-ink/10 hover:border-gold/60 hover:text-gold transition-colors"
          >
            <span className="text-base leading-none">{dark ? "☀" : "☾"}</span>
          </button>
          
          <button
            onClick={onLogout}
            className="px-4 py-2 border border-red-500/30 text-red-500 rounded-sm hover:bg-red-500/10 transition-colors"
          >
            Esci
          </button>
        </div>
      </nav>

      {/* Main View Switch */}
      {view === "dashboard" && (
        <>
          <section id="dashboard" className="scroll-mt-10">
            <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest mb-1">
                  Layout / UX
                </p>
                <h2 className="font-display text-3xl font-bold">Dashboard · Esplora le varianti</h2>
              </div>
              <div className="relative inline-flex p-1 bg-surface border border-ink/10 rounded-lg">
                {VARIANTS.map((v) => {
                  const active = variant === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVariant(v.id)}
                      className="relative px-4 py-2 rounded-md text-xs font-medium text-left z-10"
                    >
                      {active && (
                        <motion.span
                          layoutId="variant-pill"
                          transition={layoutTransition}
                          className="absolute inset-0 bg-emerald-deep rounded-md shadow-sm -z-10"
                        />
                      )}
                      <span
                        className={`block font-display font-bold uppercase tracking-wider text-[11px] transition-colors ${
                          active ? "text-paper" : "text-ink/60"
                        }`}
                      >
                        {v.label}
                      </span>
                      <span
                        className={`block text-[9px] font-mono mt-0.5 transition-colors ${
                          active ? "text-gold" : "text-ink/50"
                        }`}
                      >
                        {v.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <LayoutGroup>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={variant}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fadeTransition}
                >
                  {variant === "compact" && (
                    <CompactVariant 
                      pipelineData={pipelineData} 
                      onUploadSuccess={onUploadSuccess}
                      stats={stats}
                    />
                  )}
                  {variant === "extended" && (
                    <ExtendedVariant 
                      pipelineData={pipelineData} 
                      onUploadSuccess={onUploadSuccess}
                      stats={stats}
                    />
                  )}
                  {variant === "timeline" && (
                    <TimelineVariant 
                      pipelineData={pipelineData} 
                      onUploadSuccess={onUploadSuccess}
                      stats={stats}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </LayoutGroup>
          </section>

          <ArchiveSection 
            rows={archiveData} 
            onDelete={onDeleteCandidate}
            onStatusChange={onStatusChange}
          />
          
          <NewSearchSection onSearchTrigger={onBriefSearch} />
        </>
      )}

      {view === "skillgap" && <SkillGapView candidates={candidates} />}
      {view === "calendar" && <CalendarView candidates={candidates} />}
      {view === "reports" && <ReportsView stats={stats} />}
      {view === "gdpr" && <GdprView onCleanSuccess={onUploadSuccess} />}

      <footer className="mt-24 pt-8 border-t border-ink/10 flex justify-between text-[10px] font-mono opacity-50 uppercase tracking-widest">
        <span>Humflow · Enterprise ATS</span>
        <span>v0.3 · Palette Originale</span>
      </footer>
    </div>
  );
}
