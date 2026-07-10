import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Informativa sull'utilizzo dei cookie su Habiquo.",
};

export default function CookiePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800 mb-8 inline-block">
        ← Torna alla home
      </Link>

      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Cookie Policy</h1>
      <p className="text-sm text-neutral-500 mb-10">Ultimo aggiornamento: luglio 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-neutral-700">

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Cosa sono i cookie</h2>
          <p>I cookie sono piccoli file di testo che i siti web salvano sul dispositivo dell&apos;utente durante la navigazione. Vengono utilizzati per far funzionare i siti in modo efficiente, per ricordare le preferenze degli utenti e per raccogliere informazioni analitiche.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. Cookie utilizzati da Habiquo</h2>

          <h3 className="text-base font-semibold text-neutral-800 mt-4 mb-2">Cookie tecnici (necessari)</h3>
          <p>Essenziali per il funzionamento della piattaforma. Non richiedono consenso.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>sb-auth-token</strong> — gestione sessione utente (Supabase Auth)</li>
            <li><strong>habiquo-theme</strong> — preferenza tema chiaro/scuro</li>
          </ul>

          <h3 className="text-base font-semibold text-neutral-800 mt-4 mb-2">Cookie analitici (opzionali)</h3>
          <p>Habiquo attualmente non utilizza cookie analitici di terze parti. In futuro, qualora venissero introdotti, verrà richiesto il consenso esplicito dell&apos;utente.</p>

          <h3 className="text-base font-semibold text-neutral-800 mt-4 mb-2">Cookie di profilazione</h3>
          <p>Habiquo non utilizza cookie di profilazione o di marketing.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. Cookie di terze parti</h2>
          <p>Alcuni servizi integrati in Habiquo possono installare cookie propri:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Google Fonts</strong> — caricamento dei font tipografici</li>
          </ul>
          <p className="mt-2">Per i dettagli sui cookie di questi fornitori, si rimanda alle rispettive privacy policy.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. Come gestire i cookie</h2>
          <p>È possibile gestire o disabilitare i cookie attraverso le impostazioni del proprio browser:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Apple Safari</a></li>
          </ul>
          <p className="mt-3">Attenzione: la disabilitazione dei cookie tecnici potrebbe compromettere il corretto funzionamento della piattaforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. Aggiornamenti</h2>
          <p>Questa Cookie Policy può essere aggiornata periodicamente. Le modifiche saranno pubblicate su questa pagina con la data di aggiornamento.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. Contatti</h2>
          <p>Per qualsiasi domanda sui cookie: <a href="mailto:privacy@habiquo.it" className="text-blue-600 hover:underline">privacy@habiquo.it</a></p>
          <p className="mt-2">Per la Privacy Policy completa: <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></p>
        </section>

      </div>
    </main>
  );
}