document.addEventListener('DOMContentLoaded', function () {
  const panel = document.querySelector('.panel');
  const input = document.querySelector('.name-input');
  const button = document.querySelector('.check-button');
  const inputArea = document.querySelector('.input-area');
  const errorText = document.querySelector('.error-text');

  if (!panel || !input || !button || !inputArea || !errorText) return;

  // data-answer may hold several accepted answers, separated by spaces
  // or commas (e.g. "premika oxytocin kaleshi kabira singh").
  const answers = (panel.dataset.answer || '')
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  const target = panel.dataset.target || 'Esha.html';

  // The person's own name gets a gentle "not that name" nudge, and the
  // other doctors' names get the monkeys message. Both are configurable
  // per page via data-own-name / data-other-names; the defaults match
  // Esha's page.
  const ownName = (panel.dataset.ownName || 'esha').trim().toLowerCase();
  const otherNames = (panel.dataset.otherNames || 'vaidavi neha')
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);

  const surpriseNames = [
    'premika',
    'masakali',
    'kabira singh',
    'ironmed',
    'oxytocin',
    'vaidavi',
    'neha'
  ];

  /* ------------------------------------------------------------------
     Success chime (Web Audio API, synthesised — no audio file needed)
     ------------------------------------------------------------------ */
  let audioCtx = null;
  let audioPrimed = false;

  function getAudioCtx() {
    if (audioCtx) return audioCtx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      audioCtx = new AudioCtx();
    } catch (err) {
      audioCtx = null;
    }
    return audioCtx;
  }

  // Browsers keep audio "locked" until the user interacts. Prime the
  // context on the first interaction so it is running and ready the
  // moment the answer is correct.
  function unlockAudio() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      // A one-sample silent buffer is a common unlock trick for
      // stricter mobile browsers.
      if (!audioPrimed) {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        audioPrimed = true;
      }
    } catch (err) {
      /* ignore */
    }
  }

  function playSuccessChime() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();

      const now = ctx.currentTime + 0.03;
      const master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);

      // G5 – C6 – E6: a light, rising chime
      [783.99, 1046.5, 1318.51].forEach(function (freq, index) {
        const start = now + index * 0.1;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.3, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.3);
        gain.connect(master);

        // Fundamental plus soft overtones give a small "bell" shimmer.
        [[1, 1], [2, 0.3], [3, 0.12]].forEach(function (partial) {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq * partial[0];

          const partialGain = ctx.createGain();
          partialGain.gain.value = partial[1];

          osc.connect(partialGain);
          partialGain.connect(gain);
          osc.start(start);
          osc.stop(start + 1.4);
        });
      });
    } catch (err) {
      /* audio is a nice-to-have only */
    }
  }

  function showNote(message) {
    errorText.textContent = message;
    inputArea.classList.add('shake');
    window.setTimeout(function () {
      inputArea.classList.remove('shake');
    }, 600);
  }

  function goForward() {
    playSuccessChime();
    errorText.textContent = '';
    button.disabled = true;
    button.classList.add('success');
    button.textContent = 'Correct \u2713';
    panel.classList.add('pulse');
    input.blur();
    // Let the chime be heard before leaving the page.
    window.setTimeout(function () {
      window.location.href = target;
    }, 1300);
  }

  function check() {
    const raw = input.value.trim();
    const value = raw.toLowerCase();

    if (!raw) {
      showNote('Type your answer first.');
      input.focus();
      return;
    }

    if (answers.indexOf(value) !== -1) {
      goForward();
      return;
    }

    if (value === ownName) {
      showNote("Hey!!! it's mentioned what he calles you!");
      input.focus();
      input.select();
      return;
    }

    if (otherNames.indexOf(value) !== -1 ||
        surpriseNames.indexOf(value) !== -1) {
      showNote('Check for your suprise, not for other two doctor monkeys\u{1F31A}');
      input.focus();
      input.select();
      return;
    }

    showNote(raw + ", That's not what he calls you");
    input.focus();
    input.select();
  }

  // Prime audio on the first sign of interaction.
  input.addEventListener('focus', unlockAudio);
  input.addEventListener('input', unlockAudio);
  input.addEventListener('pointerdown', unlockAudio);
  document.addEventListener('pointerdown', unlockAudio, { once: true });

  button.addEventListener('click', check);
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      check();
    }
  });

  input.focus();
});
