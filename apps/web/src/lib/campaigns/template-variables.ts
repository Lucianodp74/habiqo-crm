/**
 * Variabili dinamiche supportate nei template di messaggio (§9 dello
 * spec): {{nome}}, {{cognome}}, {{nome_completo}}. Risolte al momento
 * dell'invio per-destinatario, a partire dallo snapshot del nome
 * salvato in campaign_recipients (full_name_snapshot) — non dal lead
 * live, per restare coerenti con la logica di snapshot della campagna.
 */
export function applyTemplateVariables(template: string, fullName: string): string {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const nome = parts[0] ?? "";
  const cognome = parts.length > 1 ? parts.slice(1).join(" ") : "";

  return template
    .replaceAll("{{nome_completo}}", trimmed)
    .replaceAll("{{nome}}", nome)
    .replaceAll("{{cognome}}", cognome);
}
