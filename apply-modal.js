// Intercepts every "Apply for Summer Program" style link (they all point to
// summer.html#apply or #apply) and shows a closed-applications notice instead
// of navigating, since the summer 2026 cycle isn't accepting applications.
// Remove this file and its <script> include once applications reopen.
(function () {
  var TARGET_HREFS = ['summer.html#apply', '#apply'];

  var css = [
    '.pam-overlay { position: fixed; inset: 0; background: rgba(23,17,43,0.55); backdrop-filter: blur(3px); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; transition: opacity 0.18s ease; }',
    '.pam-overlay.pam-open { opacity: 1; }',
    '.pam-card { background: #fff; border-radius: 14px; max-width: 440px; width: 100%; padding: 34px 32px 30px; box-shadow: 0 24px 60px rgba(23,17,43,0.28); font-family: "Poppins", sans-serif; color: #17112b; position: relative; transform: translateY(10px); transition: transform 0.18s ease; text-align: center; }',
    '.pam-overlay.pam-open .pam-card { transform: translateY(0); }',
    '.pam-close { position: absolute; top: 14px; right: 14px; width: 30px; height: 30px; border: none; background: transparent; color: #8a8595; font-size: 20px; line-height: 1; cursor: pointer; border-radius: 6px; }',
    '.pam-close:hover { background: #f1effa; color: #17112b; }',
    '.pam-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #1f3a63; display: block; margin-bottom: 12px; }',
    '.pam-card h2 { font-family: "Playfair Display", serif; font-size: 23px; font-weight: 700; margin: 0 0 12px; line-height: 1.3; }',
    '.pam-card p { font-size: 14.5px; line-height: 1.65; color: #5b5766; margin: 0 0 24px; }',
    '.pam-actions { display: flex; flex-direction: column; gap: 10px; }',
    '.pam-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #1f3a63; color: #fff; font-family: "Poppins", sans-serif; font-size: 14.5px; font-weight: 500; padding: 12px 22px; border-radius: 6px; border: none; cursor: pointer; text-decoration: none; transition: background 0.15s; }',
    '.pam-btn:hover { background: #16294a; }',
    '.pam-btn-ghost { background: transparent; color: #5b5766; font-weight: 500; }',
    '.pam-btn-ghost:hover { background: #f1effa; color: #17112b; }',
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.className = 'pam-overlay';
  overlay.setAttribute('role', 'presentation');
  overlay.innerHTML =
    '<div class="pam-card" role="dialog" aria-modal="true" aria-labelledby="pam-title">' +
      '<button type="button" class="pam-close" aria-label="Close">×</button>' +
      '<span class="pam-eyebrow">Applications</span>' +
      '<h2 id="pam-title">Summer 2026 applications are closed</h2>' +
      '<p>We’re not accepting applications for Summer 2026 right now. Applications for our next cohort open this winter — join the newsletter and we’ll email you the moment they do.</p>' +
      '<div class="pam-actions">' +
        '<a href="index.html#newsletter" class="pam-btn" id="pam-newsletter-link">Join the newsletter</a>' +
        '<button type="button" class="pam-btn pam-btn-ghost" id="pam-dismiss">Maybe later</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    overlay.classList.add('pam-open');
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.pam-close').focus();
  }

  function closeModal() {
    overlay.classList.remove('pam-open');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  overlay.querySelector('.pam-close').addEventListener('click', closeModal);
  overlay.querySelector('#pam-dismiss').addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('pam-open')) closeModal();
  });

  overlay.querySelector('#pam-newsletter-link').addEventListener('click', function (e) {
    var onIndex = /(^|\/)index\.html$/.test(location.pathname) || /\/$/.test(location.pathname);
    if (onIndex) {
      e.preventDefault();
      closeModal();
      var target = document.getElementById('newsletter');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a') : null;
    if (!link) return;
    var href = link.getAttribute('href');
    if (TARGET_HREFS.indexOf(href) === -1) return;
    e.preventDefault();
    openModal();
  });
})();
