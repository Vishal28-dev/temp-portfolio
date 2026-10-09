export default function Footer({ profile }) {
  const year = new Date().getFullYear();
  const email =
    profile?.socials?.find((s) => s.platform === 'email')?.handle ?? 'vishalworks28@gmail.com';

  const toTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  return (
    <footer className="footer">
      <div className="shell footer__inner">
        <button type="button" className="footer__top mono" onClick={toTop}>
          ↑ Back to top
        </button>

        <p className="footer__meta mono">
          &copy; {year} {profile?.name ?? 'Vishal'} — designed &amp; built from scratch
        </p>

        <a className="footer__mail mono" href={`mailto:${email}`}>{email}</a>
      </div>
    </footer>
  );
}
