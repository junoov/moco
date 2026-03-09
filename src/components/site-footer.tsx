export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p style={{ color: "var(--text-strong)", fontWeight: 600, marginBottom: "0.2rem" }}>MangaReader MVP</p>
          <p>Built with Next.js App Router for educational purposes.</p>
        </div>
        <div className="site-footer__meta">
          v0.1.0-alpha
        </div>
      </div>
    </footer>
  );
}
