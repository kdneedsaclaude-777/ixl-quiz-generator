// Inline script that runs before React hydrates so the dark-mode class is
// applied before the first paint. Prevents a light-to-dark flash on load.
const SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('quiz-app-theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var useDark = stored === 'dark' || (stored === null && prefersDark);
    if (useDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function ThemeBootstrap() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
