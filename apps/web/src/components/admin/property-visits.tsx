"use client";

import { useState, useTransition } from "react";
import { addPropertyVisit, deletePropertyVisit } from "@/lib/actions/property-visits";

interface Visit {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  visit_date: string;
  notes: string | null;
  outcome: string;
}

interface Props {
  propertyId: string;
  initialVisits: Visit[];
}

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

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("interested");

  const handleAdd = () => {
    setError(null);
    startTransition(async () => {
      const result = await addPropertyVisit({
        propertyId,
        fullName,
        phone: phone || null,
        email: email || null,
        visitDate: visitDate ?? (new Date().toISOString().split("T")[0] as string),
        notes: notes || null,
        outcome,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setVisits([{ id: result.data.id, full_name: fullName, phone: phone || null, email: email || null, visit_date: visitDate, notes: notes || null, outcome }, ...visits]);
      setFullName(""); setPhone(""); setEmail(""); setNotes(""); setOutcome("interested");
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
          + Aggiungi visita
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
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
              <label className="text-xs font-medium text-neutral-600 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mario@email.it" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 block mb-1">Data visita *</label>
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className={inputClass} />
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
              <label className="text-xs font-medium text-neutral-600 block mb-1">Note</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Es. molto interessato al prezzo" className={inputClass} />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleAdd} disabled={isPending || !fullName} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 transition-colors">
              {isPending ? "Salvataggio..." : "Salva visita"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 transition-colors">
              Annulla
            </button>
          </div>
        </div>
      )}

      {visits.length === 0 ? (
        <p className="text-sm text-neutral-500 py-4">Nessuna visita registrata.</p>
      ) : (
        <div className="space-y-2">
          {visits.map(v => (
            <div key={v.id} className="flex items-start justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">{v.full_name}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(v.visit_date).toLocaleDateString("it-IT")}
                  {v.phone && ` · ${v.phone}`}
                  {v.email && ` · ${v.email}`}
                </p>
                {v.notes && <p className="text-xs text-neutral-400 mt-0.5">{v.notes}</p>}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full whitespace-nowrap">
                  {OUTCOME_LABELS[v.outcome] ?? v.outcome}
                </span>
                <button type="button" onClick={() => handleDelete(v.id)} disabled={isPending} className="text-neutral-400 hover:text-red-500 transition-colors text-xs disabled:opacity-50">
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