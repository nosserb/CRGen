export function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="/" aria-label="Économie 80 — Comptes-rendus, accueil">
          <span className="brand-word">
            Économie<span className="brand-num">80</span>
          </span>
          <span className="brand-sep" aria-hidden />
          <span className="brand-app">Comptes-rendus</span>
        </a>

        <span className="tag tag--outline" title="Prototype réalisé pour une présentation — non affilié, données fictives">
          Prototype · données fictives
        </span>
      </div>
    </header>
  )
}
