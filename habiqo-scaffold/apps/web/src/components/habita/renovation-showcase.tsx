"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import { submitRenovation } from "@/lib/actions/submit-renovation";

type Props = { agencyId: string; agencyName: string };

type Room = {
  id: string;
  label: string;
  tag: string;
  beforeUrl: string;
  afterUrl: string;
  gain: string;
};

type Interest = {
  id: string;
  icon: string;
  title: string;
  body: string;
};

// Foto reali — Unsplash free license
// AFTER: foto caricate in sessione (pool Sicilia, masseria Toscana, villa pietra, villa pini)
// BEFORE: foto stesso stile ma più datate/da valorizzare
const ROOMS: Room[] = [
  {
    id:        "soggiorno",
    label:     "Soggiorno",
    tag:       "Home staging",
    beforeUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=70",
    afterUrl:  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=80",
    gain:      "+18% valore",
  },
  {
    id:        "cucina",
    label:     "Cucina",
    tag:       "Ristrutturazione",
    beforeUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=70",
    afterUrl:  "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=900&q=80",
    gain:      "+24% valore",
  },
  {
    id:        "esterno",
    label:     "Esterno",
    tag:       "Render AI",
    // before: villa con pini (meno premium)
    beforeUrl: "https://jwivrcofmxnpgkdolnuo.supabase.co/storage/v1/object/public/property-photos/gabriele-romano-GAUinEwfk6g-unsplash.jpg",
    // after: masseria toscana (foto caricata oggi)
    afterUrl:  "https://jwivrcofmxnpgkdolnuo.supabase.co/storage/v1/object/public/property-photos/vitaliy-burlaka-bg9cf3RMqG4-unsplash.jpg",
    gain:      "+30% valore",
  },
  {
    id:        "giardino",
    label:     "Giardino",
    tag:       "Valorizzazione",
    // before: villa pietra con giardino base
    beforeUrl: "https://jwivrcofmxnpgkdolnuo.supabase.co/storage/v1/object/public/property-photos/nikola-perekovic-HCuwXCJqWVc-unsplash.jpg",
    // after: villa con piscina e montagne (foto caricata oggi)
    afterUrl:  "https://jwivrcofmxnpgkdolnuo.supabase.co/storage/v1/object/public/property-photos/sara-abilova-f13vM9-CGtM-unsplash.jpg",
    gain:      "+35% valore",
  },
];

const INTERESTS: Interest[] = [
  {
    id:    "ristrutturazione",
    icon:  "🔨",
    title: "Ristrutturazione",
    body:  "Valutazione completa degli interventi per massimizzare il valore di vendita.",
  },
  {
    id:    "home-staging",
    icon:  "🛋",
    title: "Home Staging",
    body:  "Allestimento professionale per vendere più velocemente e a prezzo migliore.",
  },
  {
    id:    "render",
    icon:  "✨",
    title: "Render Virtuali",
    body:  "Visualizzazione 3D del potenziale dell'immobile prima di qualsiasi lavoro.",
  },
  {
    id:    "valutazione",
    icon:  "📊",
    title: "Valutazione Plus",
    body:  "Stima del valore pre e post intervento con analisi del mercato locale.",
  },
];

function BeforeAfterSlider({ room }: { room: Room }) {
  const [pos, setPos]           = useState(50);
  const [dragging, setDragging] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const containerRef            = useRef<HTMLDivElement>(null);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    const pct = Math.min(Math.max(((clientX - left) / width) * 100, 2), 98);
    setPos(pct);
    setRevealed(true);
  }, []);

  const onMouseMove = (e: React.MouseEvent) => { if (dragging) updatePos(e.clientX); };
  const onTouchMove = (e: React.TouchEvent)  => { if (e.touches[0]) updatePos(e.touches[0].clientX); };
  const onMouseDown = () => setDragging(true);
  const onMouseUp   = () => setDragging(false);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl cursor-col-resize select-none"
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseUp}
    >
      {/* AFTER */}
      <img
        src={room.afterUrl}
        alt={`Dopo — ${room.label}`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        loading="lazy"
      />

      {/* BEFORE — clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={room.beforeUrl}
          alt={`Prima — ${room.label}`}
          className="w-full h-full object-cover"
          style={{ filter: "saturate(0.5) brightness(0.82)" }}
          draggable={false}
          loading="lazy"
        />
      </div>

      {/* Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-lg z-20 pointer-events-none"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center">
          <span className="text-[10px] text-gray-600 font-bold select-none">◀▶</span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 z-10">
        <span className="text-[10px] font-bold tracking-widest uppercase
          bg-black/50 text-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
          Prima
        </span>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <span className="text-[10px] font-bold tracking-widest uppercase
          bg-[var(--accent-deep)]/90 text-white px-2 py-1 rounded-full">
          Dopo
        </span>
      </div>

      {/* Gain badge */}
      <div className="absolute bottom-3 right-3 z-10">
        <span className="text-xs font-bold
          bg-white text-[var(--accent-deep)] px-3 py-1 rounded-full shadow-md">
          {room.gain}
        </span>
      </div>

      {/* Room tag */}
      <div className="absolute bottom-3 left-3 z-10">
        <span className="text-[10px] uppercase tracking-widest
          bg-black/40 text-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
          {room.tag}
        </span>
      </div>

      {/* Hint */}
      {!revealed && (
        <div className="absolute inset-0 flex items-center justify-center z-30
          bg-black/10 pointer-events-none">
          <div className="text-white text-sm font-medium bg-black/40 px-4 py-2 rounded-full
            backdrop-blur-sm animate-pulse">
            ← Trascina per confrontare →
          </div>
        </div>
      )}
    </div>
  );
}

function RenovationForm({
  agencyId,
  agencyName,
  selectedInterest,
}: {
  agencyId: string;
  agencyName: string;
  selectedInterest: string;
}) {
  const [form, setForm]    = useState({ name: "", phone: "", email: "" });
  const [done, setDone]    = useState(false);
  const [error, setError]  = useState("");
  const [isPending, start] = useTransition();

  function set(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setError("");
  }

  function handleSubmit() {
    start(async () => {
      const result = await submitRenovation({
        agencyId,
        fullName: form.name,
        phone:    form.phone,
        email:    form.email || undefined,
        interest: selectedInterest,
      });
      if (result.ok) setDone(true);
      else setError(result.error);
    });
  }

  if (done) return (
    <div className="text-center py-8">
      <div className="w-14 h-14 rounded-full bg-[var(--color-brass-glow)] border
        border-[var(--accent-deep)]/30 flex items-center justify-center text-xl mx-auto mb-4">
        ✓
      </div>
      <p className="font-medium text-[var(--fg-primary)] text-lg mb-1">Richiesta inviata!</p>
      <p className="text-sm text-[var(--fg-secondary)]">
        Un consulente di <strong>{agencyName}</strong> ti contatterà presto.
      </p>
    </div>
  );

  const inputClass = `w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)]
    bg-[var(--bg-elevated)] text-sm focus:outline-none focus:border-[var(--fg-primary)]
    transition-colors placeholder:text-[var(--fg-muted)]`;

  return (
    <div className="space-y-3">
      <input
        type="text" placeholder="Nome e cognome *"
        value={form.name} onChange={e => set("name", e.target.value)}
        className={inputClass}
      />
      <input
        type="tel" placeholder="Telefono *"
        value={form.phone} onChange={e => set("phone", e.target.value)}
        className={inputClass}
      />
      <input
        type="email" placeholder="Email (opzionale)"
        value={form.email} onChange={e => set("email", e.target.value)}
        className={inputClass}
      />
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <button
        type="button" onClick={handleSubmit} disabled={isPending}
        className="w-full py-3.5 bg-[var(--fg-primary)] text-[var(--bg-canvas)]
          rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Invio in corso…" : "Richiedi consulenza gratuita →"}
      </button>
      <p className="text-[10px] text-[var(--fg-muted)] text-center leading-relaxed">
        Gratuito e senza impegno. I tuoi dati sono trattati nel rispetto della privacy.
      </p>
    </div>
  );
}

export function RenovationShowcase({ agencyId, agencyName }: Props) {
  const [activeRoom, setActiveRoom]   = useState<number>(0);
  const currentRoom                   = ROOMS[activeRoom] ?? ROOMS[0]!;
  const [selectedInterest, setInterest] = useState("ristrutturazione");
  const [formOpen, setFormOpen]       = useState(false);

  return (
    <section className="py-20 md:py-28 bg-[var(--bg-canvas)]">
      <div className="px-6 md:px-16 max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">
            Valorizzazione immobiliare
          </p>
          <h2 className="font-display text-4xl md:text-6xl text-[var(--fg-primary)]
            leading-tight mb-4">
            Scopri il potenziale<br />
            <span className="italic text-[var(--accent-deep)]">della tua casa.</span>
          </h2>
          <p className="text-base md:text-lg text-[var(--fg-secondary)] max-w-xl
            mx-auto leading-relaxed">
            Prima di vendere, scopri come una ristrutturazione o uno home staging
            possono aumentare il valore del tuo immobile fino al 35%.
          </p>
        </div>

        {/* Room tabs */}
        <div className="flex gap-2 justify-center flex-wrap mb-8">
          {ROOMS.map((room, i) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeRoom === i
                  ? "bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                  : "border border-[var(--border-subtle)] text-[var(--fg-secondary)] hover:border-[var(--fg-primary)]/40"
              }`}
            >
              {room.label}
            </button>
          ))}
        </div>

        {/* Slider + stats */}
        <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
          <div>
            <BeforeAfterSlider room={currentRoom} />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-[var(--fg-muted)]">
                {currentRoom.tag} · {currentRoom.label}
              </span>
              <span className="text-sm font-semibold text-[var(--accent-deep)]">
                {currentRoom.gain}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-display text-2xl md:text-3xl text-[var(--fg-primary)] mb-3">
                Un immobile valorizzato<br />vende prima e meglio.
              </h3>
              <p className="text-[var(--fg-secondary)] text-sm leading-relaxed">
                Il mercato premia gli immobili presentati al meglio.
                Una consulenza professionale pre-vendita può fare la differenza
                tra un'offerta mediocre e il prezzo che meriti.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Vendita più rapida", value: "−40 giorni" },
                { label: "Valore percepito",   value: "+22%" },
                { label: "Visite ricevute",    value: "×3" },
                { label: "Trattative al ribasso", value: "−60%" },
              ].map(stat => (
                <div key={stat.label} className="p-4 rounded-xl bg-[var(--bg-elevated)]
                  border border-[var(--border-subtle)]">
                  <p className="font-display text-xl text-[var(--fg-primary)] mb-1">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-[var(--fg-muted)]">{stat.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setFormOpen(f => !f)}
              className="w-full py-4 bg-[var(--fg-primary)] text-[var(--bg-canvas)]
                rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Richiedi una consulenza gratuita →
            </button>
          </div>
        </div>

        {/* Interest selector */}
        <div className="border-t border-[var(--border-subtle)] pt-16">
          <div className="text-center mb-10">
            <h3 className="font-display text-2xl md:text-3xl text-[var(--fg-primary)] mb-2">
              Cosa ti interessa esplorare?
            </h3>
            <p className="text-sm text-[var(--fg-secondary)]">
              Seleziona il servizio e ti contatteremo con una proposta personalizzata.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {INTERESTS.map(item => (
              <button
                key={item.id}
                onClick={() => { setInterest(item.id); setFormOpen(true); }}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  selectedInterest === item.id
                    ? "border-[var(--fg-primary)] bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--fg-primary)]/30"
                }`}
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <p className={`text-sm font-semibold mb-1 ${
                  selectedInterest === item.id ? "text-white" : "text-[var(--fg-primary)]"
                }`}>
                  {item.title}
                </p>
                <p className={`text-[11px] leading-relaxed ${
                  selectedInterest === item.id ? "text-white/60" : "text-[var(--fg-muted)]"
                }`}>
                  {item.body}
                </p>
              </button>
            ))}
          </div>

          {/* Lead form */}
          {formOpen && (
            <div className="max-w-md mx-auto bg-[var(--bg-elevated)] rounded-2xl
              border border-[var(--border-subtle)] p-6">
              <div className="mb-5">
                <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-1">
                  Consulenza gratuita
                </p>
                <h4 className="font-display text-lg text-[var(--fg-primary)]">
                  {INTERESTS.find(i => i.id === selectedInterest)?.title}
                </h4>
                <p className="text-xs text-[var(--fg-secondary)] mt-1">
                  Un consulente di {agencyName} ti risponderà entro 24 ore.
                </p>
              </div>
              <RenovationForm
                agencyId={agencyId}
                agencyName={agencyName}
                selectedInterest={selectedInterest}
              />
            </div>
          )}
        </div>

        {/* AI teaser */}
        <div className="mt-16 p-8 rounded-2xl bg-[var(--fg-primary)] text-center">
          <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
            Prossimamente
          </p>
          <h3 className="font-display text-2xl md:text-3xl text-white mb-3">
            ✦ AI Renovation Preview
          </h3>
          <p className="text-white/60 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
            Presto potrai caricare le foto del tuo immobile e vedere in pochi secondi
            come apparirebbe dopo una ristrutturazione o un home staging virtuale.
            Powered by AI.
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
            border border-white/20 text-white/70 text-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-deep)] animate-pulse" />
            In sviluppo
          </div>
        </div>
      </div>
    </section>
  );
}

