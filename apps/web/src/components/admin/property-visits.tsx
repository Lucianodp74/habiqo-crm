"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { addPropertyVisit, deletePropertyVisit } from "@/lib/actions/property-visits";

interface Visit {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  visit_date: string;
  visit_time: string | null;
  visit_type: string;
  notes: string | null;
  outcome: string;
  lead_id: string | null;
  lead_name: string | null;
}

interface LeadResult {
  id: string;
  full_name: string;
  phone: string | null;
}

interface Props {
  propertyId: string;
  initialVisits: Visit[];
}

const VISIT_TYPE_LABELS: Record<string, string> = {
  visita: "Visita",
  telefonata: "Telefonata",
  whatsapp: "WhatsApp",
  email: "Email",
  proposta: "Proposta",
  altro: "Altro",
};

const OUTCOME_LABELS: Record<string, string> = {
  interested: "Interessato",
  not_interested: "Non interessato",
  offer_made: "Offerta fatta",
  second_visit: "Seconda visita",
};

export function PropertyVisits({ propertyId, initialVisits }: Props) {
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0] ?? "");
  const [visitTime, setVisitTime] = useState("");
  const [visitType, setVisitType] = useState("visita");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("interested");

  // Lead autocomplete
  const [leadQuery, setLeadQuery] = useState("");
  const [leadResults, setLeadResults] = useState<LeadResult[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const leadContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchLeads = useCallback(async (q: string) => {
    if (q.length < 2) { setLeadResults([]); setShowLeadDropdown(false); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/leads/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setLeadResults(data);
      setShowLeadDropdown(true);
    } catch { setLeadResults([]); }
    finally { setIsSearching(false); }
  }, []);

  const handleLeadInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLeadQuery(val);
    setSelectedLead(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLeads(val), 300);
  };

  const handleLeadSelect = (lead: LeadResult) => {
    setSelectedLead(lead);
    setLeadQuery(`${lead.full_name}${lead.phone ? ` · ${lead.phone}` : ""}`);
    setFullName(lead.full_name);
    setPhone(lead.phone ?? "");
    setShowLeadDropdown(false);
    setLeadResults([]);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (leadContainerRef.current && !leadContainerRef.current.contains(e.target as Node)) {
        setShowLeadDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setFullName(""); setPhone(""); setEmail(""); setNotes("");
    setVisitType("visita"); setOutcome("interested"); setVisitTime("");
    setLeadQuery(""); setSelectedLead(null); setLeadResults([]);
    setVisitDate(new Date().toISOString().split("T")[0] ?? "");
  };

  const handleAdd = () => {
    setError(null);
    startTransition(async () => {
      const result = await addPropertyVisit({
        propertyId,
        fullName,
        phone: phone || null,
        email: email || null,
        visitDate: visitDate || new Date().toISOString().split("T")[0] as string,
        visitTime: visitTime || null,
        visitType,
        notes: notes || null,
        outcome,
        leadId: selectedLead?.id ?? null,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setVisits([{
        id: result.data.id,
        full_name: fullName,
        phone: phone || null,
        email: email || null,
        visit_date: visitDate || new Date().toISOString().split("T")[0] as string,
        visit_time: visitTime || null,
        visit_type: visitType,
        notes: notes || null,
        outcome,
        lead_id: selectedLead?.id ?? null,
        lead_name: selectedLead?.full_name ?? null,
      }, ...visits]);
      resetForm();
      setShowForm(false);
    });
  };

  const handleDelete = (visitId: string) => {
    if (!confirm("Eliminare questa visita?")) return;
    startTransition(async () => {
      await deletePropertyVisit({ visitId, propertyId });
      setVisits(visits.filter(v => v.id !== visitId));
    });
  };

  const inputClass = "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-neutral-400";

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
          Registro visite ({visits.length})
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
        >
          + Aggiungi
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">

          {/* Lead autocomplete */}
          <div ref={leadContainerRef} className="relative">
            <label className="text-xs font-medium text-neutral-600 block mb-1">
              Collega lead (opzionale)
            </label>
            <input
              type="text"
              value={leadQuery}
              onChange={handleLeadInput}
              placeholder="Cerca per nome o telefono..."
              className={inputClass}
            />
            {isSearching && <p className="text-xs text-neutral-400 mt-1">Ricerca...</p>}
            {showLeadDropdown && leadResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden">
                {leadResults.map(l => (
                  <button key={l.id} type="button" onClick={() => handleLeadSelect(l)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-neutral-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{l.full_name}</p>
                      {l.phone && <p className="text-xs text-neutral-500">{l.phone}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedLead && (
              <button type="button" onClick={() => { setSelectedLead(null); setLeadQuery(""); }}
                className="mt-1 text-xs text-neutral-400 hover:text-red-500">
                Rimuovi collegamento
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">Nome e cognome *</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Mario Rossi" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">Telefono</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+39 333 000 0000" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">Tipo evento *</label>
              <select value={visitType} onChange={e => setVisitType(e.target.value)} className={inputClass}>
                {Object.entries(VISIT_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">Esito</label>
              <select value={outcome} onChange={e => setOutcome(e.target.value)} className={inputClass}>
                {Object.entries(OUTCOME_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">Data *</label>
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">Ora</label>
              <input type="time" value={visitTime} onChange={e => setVisitTime(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-neutral-600 block mb-1">Note</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Es. molto interessato al prezzo" className={inputClass} />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleAdd} disabled={isPending || !fullName}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
              {isPending ? "Salvataggio..." : "Salva"}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors">
              Annulla
            </button>
          </div>
        </div>
      )}

      {visits.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4">Nessuna interazione registrata.</p>
      ) : (
        <div className="space-y-2">
          {visits.map(v => (
            <div key={v.id} className="flex items-start justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                    {VISIT_TYPE_LABELS[v.visit_type] ?? v.visit_type}
                  </span>
                  {v.lead_name && (
                    <span className="text-xs text-blue-600">→ {v.lead_name}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-neutral-900">{v.full_name}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(v.visit_date).toLocaleDateString("it-IT")}
                  {v.visit_time && ` ore ${v.visit_time.slice(0, 5)}`}
                  {v.phone && ` · ${v.phone}`}
                </p>
                {v.notes && <p className="text-xs text-neutral-400 mt-0.5">{v.notes}</p>}
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {OUTCOME_LABELS[v.outcome] ?? v.outcome}
                </span>
                <button type="button" onClick={() => handleDelete(v.id)} disabled={isPending}
                  className="text-neutral-400 hover:text-red-500 transition-colors text-xs disabled:opacity-50">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}