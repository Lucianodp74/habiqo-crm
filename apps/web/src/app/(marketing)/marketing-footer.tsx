// app/(marketing)/marketing-footer.tsx

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#e8e5df] bg-[#FAF9F6]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

          {/* Brand */}
          <div>
            <p className="font-display text-[18px] font-bold text-[#1a1a18] mb-2">HABIQUO</p>
            <p
              className="text-[13px] text-[#9a9490] max-w-[280px] leading-relaxed"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Il CRM AI per agenzie immobiliari italiane.
              Smart living. Smart real estate.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {[
              { label: 'Funzionalità',    href: '#funzionalita'  },
              { label: 'AI Renovation',   href: '#ai-renovation' },
              { label: 'Founder Access',  href: '#founder-access'},
              { label: 'Accedi',          href: '/login'         },
              { label: 'Registrati',      href: '/register'      },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] text-[#6b6660] hover:text-[#1a1a18] transition-colors"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                {link.label}
              </a>
            ))}
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#e8e5df] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p
            className="text-[12px] text-[#b8b4ae]"
            style={{ fontFamily: 'system-ui, sans-serif' }}
          >
            © {new Date().getFullYear()} Habiquo · Tutti i diritti riservati
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-[12px] text-[#b8b4ae] hover:text-[#6b6660] transition-colors" style={{ fontFamily: 'system-ui, sans-serif' }}>Privacy</a>
            <a href="#" className="text-[12px] text-[#b8b4ae] hover:text-[#6b6660] transition-colors" style={{ fontFamily: 'system-ui, sans-serif' }}>Termini</a>
            <span className="text-[12px] text-[#b8b4ae]" style={{ fontFamily: 'system-ui, sans-serif' }}>GDPR by design 🇮🇹</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
