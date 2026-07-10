import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Informativa sul trattamento dei dati personali di Habiquo.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800 mb-8 inline-block">
        ← Torna alla home
      </Link>

      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-neutral-500 mb-10">Ultimo aggiornamento: luglio 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700">

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Titolare del trattamento</h2>
          <p>Il titolare del trattamento dei dati personali è <strong>Habiquo S.r.l.</strong> (o il soggetto giuridico che gestisce la piattaforma Habiquo), con sede legale in Italia. Per qualsiasi comunicazione relativa alla privacy, è possibile scrivere a: <a href="mailto:privacy@habiquo.it" className="text-blue-600 hover:underline">privacy@habiquo.it</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. Dati raccolti</h2>
          <p>Habiquo raccoglie i seguenti dati personali:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Dati di registrazione: nome, cognome, indirizzo email, numero di telefono</li>
            <li>Dati professionali: nome agenzia immobiliare, ruolo</li>
            <li>Dati di utilizzo: log di accesso, funzionalità utilizzate, preferenze</li>
            <li>Dati dei clienti (lead) inseriti dagli utenti della piattaforma</li>
            <li>Dati degli immobili inseriti dagli utenti</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. Finalità del trattamento</h2>
          <p>I dati vengono trattati per le seguenti finalità:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Fornitura del servizio CRM immobiliare</li>
            <li>Gestione degli account utente e dell&apos;autenticazione</li>
            <li>Miglioramento della piattaforma e supporto tecnico</li>
            <li>Adempimento di obblighi legali e contrattuali</li>
            <li>Invio di comunicazioni di servizio</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. Base giuridica</h2>
          <p>Il trattamento si basa su:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Esecuzione del contratto</strong> (art. 6 par. 1 lett. b GDPR) per la fornitura del servizio</li>
            <li><strong>Legittimo interesse</strong> (art. 6 par. 1 lett. f GDPR) per il miglioramento del servizio</li>
            <li><strong>Obbligo legale</strong> (art. 6 par. 1 lett. c GDPR) per gli adempimenti normativi</li>
            <li><strong>Consenso</strong> (art. 6 par. 1 lett. a GDPR) per comunicazioni di marketing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. Conservazione dei dati</h2>
          <p>I dati personali vengono conservati per il tempo strettamente necessario alle finalità per cui sono stati raccolti. In generale:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Dati account: per tutta la durata del rapporto contrattuale e fino a 10 anni dopo la cessazione</li>
            <li>Log di sistema: fino a 12 mesi</li>
            <li>Dati di marketing: fino alla revoca del consenso</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. Destinatari dei dati</h2>
          <p>I dati possono essere comunicati a:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Supabase Inc.</strong> — infrastruttura database e autenticazione (USA, con garanzie adeguate)</li>
            <li><strong>Vercel Inc.</strong> — hosting e distribuzione dell&apos;applicazione (USA, con garanzie adeguate)</li>
            <li><strong>Replicate Inc.</strong> — generazione di render AI (USA, con garanzie adeguate)</li>
            <li>Autorità competenti, ove richiesto dalla legge</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. Diritti degli interessati</h2>
          <p>In conformità al GDPR, l&apos;interessato ha il diritto di:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Accedere ai propri dati personali (art. 15)</li>
            <li>Rettificare i dati inesatti (art. 16)</li>
            <li>Richiedere la cancellazione dei dati (art. 17)</li>
            <li>Limitare il trattamento (art. 18)</li>
            <li>Portare i dati ad altro titolare (art. 20)</li>
            <li>Opporsi al trattamento (art. 21)</li>
            <li>Proporre reclamo al Garante Privacy (www.garanteprivacy.it)</li>
          </ul>
          <p className="mt-3">Per esercitare i propri diritti: <a href="mailto:privacy@habiquo.it" className="text-blue-600 hover:underline">privacy@habiquo.it</a></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">8. Cookie</h2>
          <p>Per informazioni sui cookie utilizzati da Habiquo, consulta la nostra <Link href="/cookie" className="text-blue-600 hover:underline">Cookie Policy</Link>.</p>
        </section>

      </div>
    </main>
  );
}