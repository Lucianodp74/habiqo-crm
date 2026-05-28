# Come integrare RenovationShowcase in HabitaMi

## 1. Copia i file

- `apps/web/src/components/habita/renovation-showcase.tsx`
- `apps/web/src/lib/actions/submit-renovation.ts`

## 2. Aggiungi alla homepage dell'agenzia

Apri: `apps/web/src/app/[agencySlug]/page.tsx`

Aggiungi l'import:
```tsx
import { RenovationShowcase } from "@/components/habita/renovation-showcase";
```

Aggiungi dopo la sezione hero o dopo gli immobili:
```tsx
<RenovationShowcase
  agencyId={agency.id}
  agencyName={agency.name}
/>
```

## 3. Oppure crea una pagina dedicata

Crea: `apps/web/src/app/[agencySlug]/valorizza-casa/page.tsx`

```tsx
import { getAgencyBySlug } from "@/lib/habita/tenant";
import { notFound } from "next/navigation";
import { RenovationShowcase } from "@/components/habita/renovation-showcase";

type Params = Promise<{ agencySlug: string }>;

export default async function ValorizzaCasaPage({ params }: { params: Params }) {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) notFound();

  return (
    <div className="min-h-screen">
      <div className="pt-20 px-6 md:px-16 pb-8 bg-[var(--bg-elevated)]
        border-b border-[var(--border-subtle)]">
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
          {agency.name}
        </p>
        <h1 className="font-display text-5xl md:text-7xl text-[var(--fg-primary)]">
          Trasforma<br />
          <span className="italic">il tuo immobile.</span>
        </h1>
      </div>
      <RenovationShowcase agencyId={agency.id} agencyName={agency.name} />
    </div>
  );
}
```

## 4. Aggiungi "Valorizza casa" nel nav

In `agency-header.tsx` aggiungi dopo "Valuta casa":
```tsx
<Link href={`/${agencySlug}/valorizza-casa`} ...>
  Valorizza casa
</Link>
```

## 5. I lead arrivano nel CRM

Ogni submit crea un lead con:
- source = "renovation"
- source_detail = tipo servizio selezionato
- temperature = "warm"

Visibili nel Kanban Habiquo.
