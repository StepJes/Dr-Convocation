/* ------------------------------------------------------------------
   Shared countdown timer — used by ETimer.html and VTimer.html.

   The page loads this script and declares where to go next via:
     <body data-next="ETransition.html">

   TARGET DATE
   -----------
   Configure it once here, for every countdown page. As long as the
   "testing" line is active, the confetti finale + redirect fire as
   soon as the page opens (handy while building). Before going live,
   comment the testing line out and uncomment the real countdown.
   ------------------------------------------------------------------ */

// Real countdown at 12:00 AM (visitor's local time).
// Esha and Vaidavi: October 28, 2026. Neha: October 29, 2026.
const isNeha = document.body.dataset.next === "NTransition.html";
const targetDate = new Date(2026, 9, isNeha ? 29 : 28, 0, 0, 0).getTime();

// Testing (active): the moment is "already here" — finale fires on load.
// const targetDate = Date.now() - 1000;

// Where to head after the celebration. Set per page via <body data-next>.
const nextPage = document.body.dataset.next || "ETransition.html";

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const messageEl = document.getElementById("message");
const countdownEl = document.querySelector(".countdown");
const containerEl = document.querySelector(".container");
const preCountdownSubtitles = document.querySelectorAll(".subtitle");

const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// How long the confetti celebration lasts before we glide away.
const CELEBRATION_MS = 3000;
// Duration of the smooth fade / scale-out transition.
const FADE_MS = 800;

let finished = false;
let timer = null;

function updateCountdown() {
  const now = Date.now();
  const difference = targetDate - now;

  if (difference <= 0) {
    preCountdownSubtitles.forEach(sub => sub.style.display = "none");
    timeUp();
    return;
  }

  const totalSeconds = Math.floor(difference / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  daysEl.textContent = String(days).padStart(3, "0");
  hoursEl.textContent = String(hours).padStart(2, "0");
  minutesEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = String(seconds).padStart(2, "0");

  if (difference > 0) {
    preCountdownSubtitles.forEach(sub => sub.style.display = "");
  }
}

// The moment arrives: zero the clock, blast the confetti, then leave.
function timeUp() {
  if (finished) return;
  finished = true;
  clearInterval(timer);

  daysEl.textContent = "000";
  hoursEl.textContent = "00";
  minutesEl.textContent = "00";
  secondsEl.textContent = "00";

  countdownEl.style.display = "none";
  preCountdownSubtitles.forEach(sub => sub.style.display = "none");
  // Hand control of the container over to the exit transition.
  containerEl.style.animation = "none";
  messageEl.classList.add("show");

  if (!prefersReducedMotion) {
    launchConfetti();
  }

  setTimeout(startExit, prefersReducedMotion ? 1500 : CELEBRATION_MS);
}

// Scale + blur the page out under a fading overlay, then hand
// the visitor over to the next page in the flow.
function startExit() {
  if (!prefersReducedMotion && typeof containerEl.animate === "function") {
    containerEl.animate(
      [
        { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
        { opacity: 0, transform: "scale(1.05)", filter: "blur(10px)" }
      ],
      { duration: FADE_MS, easing: "ease", fill: "forwards" }
    );
  }

  document.body.classList.add("leaving");

  setTimeout(() => {
    window.location.href = nextPage;
  }, FADE_MS);
}

// Lightweight canvas confetti (no external libraries): several timed
// cannon blasts that spray across — and off — the edges of the page.
function launchConfetti() {
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize);

  const colors = [
    "#8b5cf6", "#a78bfa", "#67e8f9", "#22d3ee",
    "#f472b6", "#fbbf24", "#ffffff"
  ];
  const particles = [];
  const gravity = 0.22;
  const TAU = Math.PI * 2;

  function burst(x, y, count, angle, spread, minSpeed, maxSpeed) {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        w: 5 + Math.random() * 7,
        h: 8 + Math.random() * 10,
        rot: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 0.3,
        sway: Math.random() * TAU,
        swaySpeed: 0.04 + Math.random() * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  // Timed blasts: center explosion, corner cannons shooting up,
  // a rain from above, side pops — and a final center burst.
  const blasts = [
    [0,    () => burst(width * 0.5, height * 0.5, 130, 0, TAU, 4, 13)],
    [0,    () => burst(width * 0.08, height, 70, -Math.PI / 3, 0.7, 11, 20)],
    [0,    () => burst(width * 0.92, height, 70, (-Math.PI * 2) / 3, 0.7, 11, 20)],
    [450,  () => burst(width * 0.5, height * 0.12, 80, Math.PI / 2, 1.4, 6, 14)],
    [900,  () => burst(width * 0.25, height * 0.55, 70, 0, TAU, 3, 11)],
    [900,  () => burst(width * 0.75, height * 0.45, 70, 0, TAU, 3, 11)],
    [1500, () => burst(width * 0.1, height, 60, -Math.PI / 3, 0.8, 12, 21)],
    [1500, () => burst(width * 0.9, height, 60, (-Math.PI * 2) / 3, 0.8, 12, 21)],
    [2100, () => burst(width * 0.5, height * 0.35, 110, 0, TAU, 4, 12)]
  ];

  let lastBlast = 0;
  blasts.forEach(([delay, fire]) => {
    setTimeout(fire, delay);
    if (delay > lastBlast) lastBlast = delay;
  });
  const endAt = lastBlast + 500;

  function frame() {
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.vy += gravity;
      p.vx *= 0.995;
      p.sway += p.swaySpeed;
      p.x += p.vx + Math.sin(p.sway);
      p.y += p.vy;
      p.rot += p.vr;

      // Once a piece flies out of the page, it is gone for good.
      if (p.y > height + 40 || p.x < -60 || p.x > width + 60) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // Flutter: squash horizontally so the paper looks like it flips.
      ctx.scale(Math.max(0.15, Math.abs(Math.cos(p.sway * 1.3))), 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w / 2, p.h);
      ctx.restore();
    }

    if (particles.length > 0 || Date.now() < endAt) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

updateCountdown();
if (!finished) {
  timer = setInterval(updateCountdown, 1000);
}
