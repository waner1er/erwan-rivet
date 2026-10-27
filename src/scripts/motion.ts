// Public-site enhancements, layered on content that already works without them:
// tech band laid out word by word, and colour coming back on touch screens.

const finePointer = matchMedia('(pointer: fine)').matches;

// Tech band: "PHP · Laravel · …" becomes one span per word, so every other word can be outlined.
for (const band of document.querySelectorAll<HTMLElement>('.wan-marquee')) {
  if (band.querySelector('.wan-marquee__track')) continue;
  const words = (band.textContent ?? '').split('·').map((w) => w.trim()).filter(Boolean);
  if (!words.length) continue;
  const track = document.createElement('span');
  track.className = 'wan-marquee__track';
  for (const word of words) {
    const span = document.createElement('span');
    span.textContent = word;
    track.append(span);
  }
  band.replaceChildren(track);
}

// No hover on touch screens: a project gets its colour back while it crosses the middle of the screen.
if (!finePointer) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-lit', e.isIntersecting)),
    { rootMargin: '-40% 0px -40% 0px' },
  );
  document.querySelectorAll('.wan-card--link').forEach((el) => io.observe(el));
}
