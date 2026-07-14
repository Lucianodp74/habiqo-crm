import re

path = "apps/web/src/components/admin/property-create-ai-flow.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

changes = 0

old1 = '''    agencyLocationId: locations.length === 1 ? locations[0].id : "",'''
new1 = '''    agencyLocationId: locations.length === 1 ? (locations[0]?.id ?? "") : "",'''
c1 = content.count(old1)
if c1 == 1:
    content = content.replace(old1, new1, 1)
    changes += 1
    print("Fix 1 applicato (stato iniziale agencyLocationId)")
else:
    print(f"ATTENZIONE Fix 1: atteso 1 match, trovati {c1} — controllare manualmente")

old2 = '''  const priceLabel =
    formData.contractType === "rent" ? "Prezzo (€/mese)" : "Prezzo (€)";

  return ('''
new2 = '''  const priceLabel =
    formData.contractType === "rent" ? "Prezzo (€/mese)" : "Prezzo (€)";
  const soleLocation = locations.length === 1 ? locations[0] : undefined;

  return ('''
c2 = content.count(old2)
if c2 == 1:
    content = content.replace(old2, new2, 1)
    changes += 1
    print("Fix 2 applicato (variabile soleLocation)")
else:
    print(f"ATTENZIONE Fix 2: atteso 1 match, trovati {c2} — controllare manualmente")

old3 = '''      {locations.length === 1 && (
        <Field label="Sede">
          <div className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-elevated)] text-[var(--fg-secondary)] text-base">
            {locations[0].name}'''
new3 = '''      {soleLocation && (
        <Field label="Sede">
          <div className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-elevated)] text-[var(--fg-secondary)] text-base">
            {soleLocation.name}'''
c3 = content.count(old3)
if c3 == 1:
    content = content.replace(old3, new3, 1)
    changes += 1
    print("Fix 3 applicato (rendering condizionale + soleLocation.name)")
else:
    print(f"ATTENZIONE Fix 3: atteso 1 match, trovati {c3} — controllare manualmente")

if changes == 3:
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("=== TUTTE E 3 LE CORREZIONI APPLICATE — file salvato ===")
else:
    print(f"=== SOLO {changes}/3 CORREZIONI APPLICATE — file NON salvato, nessuna modifica scritta ===")
