# Note sulla cronologia delle migration — Habiquo

## Duplicazione del numero `0013` (risolta il 12/07/2026)

Il progetto conteneva due file di migration con lo stesso numero di versione `0013`:

- `0013_property_photos_storage.sql` (13 maggio 2026) — bucket storage foto immobili
- `0013_lead_preferences.sql` (27 maggio 2026) — colonne preferenze di ricerca lead

Questa duplicazione ha causato un disallineamento tra la cronologia locale
delle migration e la tabella di tracciamento remota di Supabase, impedendo
l'esecuzione di `supabase db push` per lo Sprint 1 del Visibility Engine.

**Intervento applicato:**

Il file `0013_lead_preferences.sql` è stato rinominato in
`0014_lead_preferences.sql` tramite `git mv` (cronologia Git preservata).

**Importante:** nessuna riga di contenuto SQL è stata modificata o
rieseguita. Entrambe le migration erano già state applicate al database
di produzione in passato (confermato dal funzionamento reale delle
funzionalità collegate — upload foto immobili e matching lead-immobile,
entrambe attive su HabitaMi al momento dell'intervento). L'operazione ha
riallineato solo il registro interno delle migration (tramite
`supabase migration repair --status applied`), senza alcuna esecuzione
di comandi SQL sul database.

Il commento interno al file (`-- Migration: 0013_lead_preferences.sql`)
non è stato aggiornato per non alterare il contenuto SQL originale, come
da indicazione esplicita ricevuta durante l'intervento.

## Debito tecnico noto, non ancora risolto

Va verificato se altri numeri di migration duplicati esistono nel
progetto. Al momento dell'intervento del 12/07/2026 non ne sono stati
trovati altri, ma la verifica è stata mirata al problema specifico
riscontrato, non è stato un audit completo di tutta la cartella
`supabase/migrations/`.
