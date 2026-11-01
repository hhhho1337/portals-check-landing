const art = document.querySelector('#art');
document.querySelector('#logo').append(PIe({width: 230, height: 47}));
document.querySelector('#stars').append($Ie({width: '100%', height: '100%'}));
const asset = name => `assets/${name}.webp`;
const circle = [
  null,
  ['LIe',144,35.85,41.85,67.53,-5.09,0,0],
  ['icon-blue-hand-B1FDRe71',144,18.52,25.85,100.83,-5.09,-.367,0],
  ['icon-blue-blur-DF9kqjHk',144,29.91,37.58,78.81,-5.09,-2.783,-2.467],
  ['icon-gold-helmet-DBfERQGc',144,27.73,34.4,85.12,-5.09,0,0],
  ['icon-green-hand-C-jvLtMV',144,39,51.67,61.89,-5.09,-.95,0],
  ['icon-pink-bear-M0VRLbo9',144,22.49,31.82,92.92,-5.09,-.517,-1.417],
  ['tFe',144,37.38,48.71,63.9,-5.09,-2.133,-.633],
];
const square = [
  ['icon-seablue-blur-DM1MS_EF',128,-4.2,5.46,129.55,-4.53,-1.833,-1.983],
  ['icon-brick-loFAs8aU',128,10.69,21,101.98,-4.53,-2.067,-.733],
  ['icon-tg-CWJGwFas',128,13.33,16.49,95.67,-4.53,-2.983,0],
  ['icon-pink-cap-BfCxkCLr',128,24.33,31.33,73.91,-4.53,0,0],
];
function addIcon([name, box, left, top, size, bob, delay, tilt], x, y, behind = false) {
  const frame = document.createElement('div');
  frame.className = 'icon-box';
  Object.assign(frame.style, {width: `${box}px`, height: `${box}px`, transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`});
  const motion = document.createElement('div');
  motion.className = 'loader-icon-bob';
  Object.assign(motion.style, {left: `${left}px`, top: `${top}px`, width: `${size}px`, height: `${size}px`, animationDelay: `${delay}s`});
  motion.style.setProperty('--loader-bob', `${bob}px`);
  const image = document.createElement('img');
  image.src = asset(name); image.alt = ''; image.draggable = false;
  image.className = 'loader-icon-tilt'; image.style.animationDelay = `${tilt}s`;
  motion.append(image); frame.append(motion);
  if (behind) art.insertBefore(frame, document.querySelector('.pepe')); else art.append(frame);
}
circle.forEach((icon, index) => {
  if (icon) { const angle = 2 * Math.PI * index / circle.length; addIcon(icon, Math.cos(angle) * 144, Math.sin(angle) * 144, true); }
});
const corners = [[-170,-170],[170,-170],[170,170],[-170,170]];
square.forEach((icon, index) => addIcon(icon, ...corners[index]));
const fill = document.querySelector('#progress-fill');
const progress = document.querySelector('.progress');
const loader = document.querySelector('#loader');
let current = 0;
function setProgress(value) {
  current = Math.max(0, Math.min(100, Number(value) || 0));
  fill.style.transform = `translateX(-${100 - current}%)`;
  progress.setAttribute('aria-valuenow', String(current));
}
let timer = setInterval(() => {
  if (current <= 70) setProgress(current + 5);
  else clearInterval(timer);
}, 50);
window.loader = {
  setProgress(value) { clearInterval(timer); setProgress(value); },
  finish() { clearInterval(timer); setProgress(100); setTimeout(() => loader.classList.add('is-hidden'), 200); },
  show() { loader.classList.remove('is-hidden'); setProgress(0); }
};
