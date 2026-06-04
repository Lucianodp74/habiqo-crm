import { AiCard, AiCardGroup, CopyButton } from "@/components/ai/AiCard";

export const metadata = { title: "AI Assistant · Habiquo" };

// ─── Contenuti statici ────────────────────────────────────────────

const FOLLOW_UP_TEMPLATES = [
  {
    stage: "Nuovo lead",
    text: "Ciao {{nome}}, ho ricevuto la tua richiesta e volevo contattarti per capire meglio cosa stai cercando. Quando possiamo parlare cinque minuti?",
  },
  {
    stage: "Dopo visita",
    text: "Ciao {{nome}}, come hai trovato l'immobile che abbiamo visto insieme? Hai avuto modo di riflettere? Sono a disposizione per qualsiasi domanda.",
  },
  {
    stage: "Trattativa ferma",
    text: "Ciao {{nome}}, volevo aggiornarti sulla situazione. Hai avuto modo di parlare con la tua famiglia? Possiamo sentirci questa settimana?",
  },
];

const PHONE_SCRIPTS = [
  {
    fase: "Apertura",
    testo: "Buongiorno {{nome}}, sono {{agente}} di {{agenzia}}. La chiamo perché ho visto il suo annuncio e volevo capire meglio come posso aiutarla.",
  },
  {
    fase: "Qualificazione",
    testo: "Perfetto. Per capire meglio: sta cercando per uso personale o investimento? Ha un budget di riferimento? Ha già visitato altri immobili?",
  },
  {
    fase: "Chiusura",
    testo: "Ottimo, credo di avere alcune soluzioni interessanti per lei. Le farebbe piacere incontrarci questa settimana per una consulenza senza impegno?",
  },
];

const EMAIL_TEMPLATES = [
  {
    tipo: "Primo contatto",
    oggetto: "Richiesta informazioni — {{titolo immobile}}",
    testo: "Gentile {{nome}},\n\ngrazie per averci contattato. Ho preso in carico la sua richiesta e sarò lieto di accompagnarla nella ricerca dell'immobile ideale.\n\nLe propongo un breve appuntamento conoscitivo per capire meglio le sue esigenze.\n\nCordiali saluti,\n{{agente}} — {{agenzia}}",
  },
  {
    tipo: "Post-visita",
    oggetto: "Grazie per la visita — {{titolo immobile}}",
    testo: "Gentile {{nome}},\n\nè stato un piacere accompagnarla nella visita di oggi. Come ha trovato l'immobile?\n\nSono a sua disposizione per qualsiasi chiarimento o per organizzare un secondo sopralluogo.\n\nCordiali saluti,\n{{agente}} — {{agenzia}}",
  },
];

const VISIT_CHECKLIST = [
  "Confermare orario e indirizzo con il cliente",
  "Preparare scheda tecnica dell'immobile",
  "Stampare planimetria",
  "Verificare disponibilità chiavi",
  "Portare modulo proposta d'acquisto",
  "Ricercare immobili simili per comparazione prezzi",
  "Preparare domande di qualificazione",
  "Verificare disponibilità parcheggio nella zona",
];

const ACQUISITION_SCRIPT: Record<string, string> = {
  Apertura: "Buongiorno, sono {{agente}} di {{agenzia}}. Ho visto il suo immobile in vendita e avrei una proposta interessante da farle. Ha cinque minuti?",
  Proposta: "Lavoriamo esclusivamente con mandati in esclusiva perché questo ci permette di investire risorse vere nella vendita: fotografia professionale, promozione sui portali premium, rete di acquirenti qualificati.",
  Chiusura: "Possiamo fissare un appuntamento per una valutazione gratuita senza impegno? Le mostro esattamente come lavoriamo e cosa otterrebbe affidando l'incarico a noi.",
};

const OBIEZIONI = [
  {
    obiezione: "\"Le agenzie costano troppo\"",
    risposta: "Capisco la preoccupazione. Ma considera che vendere da solo richiede tempo, competenze legali e rischia di attirare acquirenti non qualificati. La nostra commissione è un investimento: gestiamo tutto noi, tu incassi il giusto prezzo nei tempi giusti.",
  },
  {
    obiezione: "\"Voglio vendere da solo\"",
    risposta: "È una scelta legittima. Posso chiederle: sa come qualificare un acquirente prima di mostrare casa? Sa come gestire la parte legale? Se dovesse avere difficoltà, siamo qui.",
  },
  {
    obiezione: "\"Perché dovrei firmare un'esclusiva?\"",
    risposta: "Perché senza esclusiva non possiamo investire davvero nel tuo immobile. L'esclusiva ci permette di pianificare, investire in marketing e proteggere il tuo prezzo.",
  },
  {
    obiezione: "\"Devo pensarci\"",
    risposta: "Certo, è una decisione importante. Posso chiederle cosa la frena? A volte un dubbio specifico si risolve in due minuti. Altrimenti fissiamo un secondo appuntamento.",
  },
];

// ─── Page (Server Component) ─────────────────────────────────────

export default function AiAssistantPage() {
  return (
    <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto">

      <header className="mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-muted)] mb-2">
          AI Assistant
        </p>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] text-[var(--fg-primary)] leading-tight">
          Assistente operativo
        </h1>
        <p className="text-[13px] text-[var(--fg-muted)] mt-2 max-w-2xl">
          Strumenti per comunicare meglio, gestire i lead e acquisire nuovi incarichi.
        </p>
      </header>

      {/* Comunicazione */}
      <AiCardGroup icon="💬" label="Comunicazione">

        <AiCard
          icon="✉️"
          title="Genera Follow-Up"
          description="Template di follow-up pronti per ogni fase della trattativa."
          expandable={
            <div className="space-y-3">
              {FOLLOW_UP_TEMPLATES.map((t) => (
                <div key={t.stage} className="rounded-xl bg-[var(--bg-sunken)] p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[var(--fg-muted)] mb-1.5">
                    {t.stage}
                  </p>
                  <p className="text-[12px] text-[var(--fg-primary)] leading-relaxed italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <CopyButton text={t.text} />
                </div>
              ))}
            </div>
          }
        />

        <AiCard
          icon="📱"
          title="Messaggio WhatsApp"
          description="Apri il menu WhatsApp dalla scheda di un lead con messaggi precompilati per ogni stage."
          href="/crm/leads"
        />

        <AiCard
          icon="📞"
          title="Script Telefonata"
          description="Script strutturato per chiamate di primo contatto, qualificazione e chiusura appuntamento."
          expandable={
            <div className="space-y-3">
              {PHONE_SCRIPTS.map((s) => (
                <div key={s.fase} className="rounded-xl bg-[var(--bg-sunken)] p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[var(--fg-muted)] mb-1.5">
                    {s.fase}
                  </p>
                  <p className="text-[12px] text-[var(--fg-primary)] leading-relaxed italic">
                    &ldquo;{s.testo}&rdquo;
                  </p>
                  <CopyButton text={s.testo} />
                </div>
              ))}
            </div>
          }
        />

        <AiCard
          icon="📧"
          title="Email Professionale"
          description="Template email per primo contatto e post-visita. Pronti da personalizzare."
          expandable={
            <div className="space-y-3">
              {EMAIL_TEMPLATES.map((e) => (
                <div key={e.tipo} className="rounded-xl bg-[var(--bg-sunken)] p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[var(--fg-muted)] mb-1">
                    {e.tipo}
                  </p>
                  <p className="text-[11px] font-medium text-[var(--fg-secondary)] mb-1.5">
                    Oggetto: {e.oggetto}
                  </p>
                  <pre className="text-[11px] text-[var(--fg-primary)] leading-relaxed whitespace-pre-wrap font-sans">
                    {e.testo}
                  </pre>
                  <CopyButton text={e.testo} />
                </div>
              ))}
            </div>
          }
        />

      </AiCardGroup>

      {/* Gestione Lead */}
      <AiCardGroup icon="🏠" label="Gestione Lead">

        <AiCard
          icon="🔍"
          title="Analizza Lead"
          description="Apri la scheda di un lead per vedere insight operativo, probabilità di conversione e next best action."
          href="/crm/leads"
        />

        <AiCard
          icon="📋"
          title="Prepara Visita"
          description="Checklist completa per non dimenticare nulla prima di ogni appuntamento."
          expandable={
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wide text-[var(--fg-muted)] mb-3">
                Checklist pre-visita
              </p>
              <ul className="space-y-2">
                {VISIT_CHECKLIST.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--fg-primary)]">
                    <span className="w-4 h-4 rounded border border-[var(--border-subtle)] flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          }
        />

        <AiCard
          icon="⚡"
          title="Lead Urgenti"
          description="Visualizza i lead inattivi che rischiano di raffreddarsi. Agisci prima che sia troppo tardi."
          href="/crm/leads"
        />

        <AiCard
          icon="📊"
          title="Riassunto Cliente"
          description="Apri la scheda lead per vedere profilo completo, timeline attività e insight AI."
          href="/crm/leads"
          status="beta"
        />

      </AiCardGroup>

      {/* Acquisizione */}
      <AiCardGroup icon="🎯" label="Acquisizione Incarichi">

        <AiCard
          icon="🏆"
          title="Script Acquisizione"
          description="Script professionale per acquisire incarichi in esclusiva da proprietari privati."
          expandable={
            <div className="space-y-3">
              {Object.entries(ACQUISITION_SCRIPT).map(([fase, testo]) => (
                <div key={fase} className="rounded-xl bg-[var(--bg-sunken)] p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-[var(--fg-muted)] mb-1.5">
                    {fase}
                  </p>
                  <p className="text-[12px] text-[var(--fg-primary)] leading-relaxed italic">
                    &ldquo;{testo}&rdquo;
                  </p>
                  <CopyButton text={testo} />
                </div>
              ))}
            </div>
          }
        />

        <AiCard
          icon="🛡️"
          title="Gestisci Obiezioni"
          description="Risposte pronte per le obiezioni più comuni: costi, esclusiva, concorrenza, tempi."
          expandable={
            <div className="space-y-4">
              {OBIEZIONI.map((o, i) => (
                <div key={i} className="rounded-xl bg-[var(--bg-sunken)] p-3">
                  <p className="text-[12px] font-semibold text-[var(--fg-primary)] mb-2">
                    {o.obiezione}
                  </p>
                  <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">
                    {o.risposta}
                  </p>
                  <CopyButton text={o.risposta} />
                </div>
              ))}
            </div>
          }
        />

        <AiCard
          icon="🤖"
          title="Genera Script AI"
          description="Genera script personalizzati per acquisizione, follow-up e trattativa con intelligenza artificiale."
          status="coming_soon"
        />

      </AiCardGroup>

      <p className="text-[11px] text-[var(--fg-muted)] text-center mt-4">
        Gli strumenti con AI generativa saranno disponibili nel prossimo aggiornamento.
      </p>

    </div>
  );
}
