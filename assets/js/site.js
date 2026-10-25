// DayTone website: reveal on scroll, counters and the ii–V–I keyboard demo.
// Plain JavaScript, no dependencies, nothing loaded from elsewhere.
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The navigation bar gets a hairline once the page scrolls under it.
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Sections slide in as they come into view; counters count up.
  const countUp = (element) => {
    const target = Number(element.dataset.count);
    if (reducedMotion || !target) return;
    const start = performance.now();
    const duration = 1100;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      element.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))).toLocaleString('en-US');
      if (t < 1) requestAnimationFrame(step);
    };
    element.textContent = '0';
    requestAnimationFrame(step);
  };

  const revealed = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealed.forEach((element) => observer.observe(element));
  } else {
    revealed.forEach((element) => element.classList.add('is-visible'));
  }

  // The keyboard demo ------------------------------------------------------

  const demo = document.getElementById('demo');
  const voicings = window.DAYTONE_VOICINGS;
  if (!demo || !voicings) return;

  const SUBTITLES = {
    root: 'Seventh chords in root position, the root doubled in the left hand',
    shells: 'Two-note shells, A shape: root and 7th, then root and 3rd',
    a: 'Rootless A and B voicings, starting on A, the root in the left hand',
  };
  const SUFFIX = {
    major: '',
    minor: 'm',
    minorSeventh: 'm7',
    dominantSeventh: '7',
    majorSeventh: 'maj7',
    halfDiminishedSeventh: 'ø7',
    dominantFlatNinth: '7♭9',
  };
  const BLACK = new Set([1, 3, 6, 8, 10]);
  const WHITE_W = 20;
  const WHITE_H = 100;
  const BLACK_W = 12;
  const BLACK_H = 62;
  const SVG = 'http://www.w3.org/2000/svg';

  const keySelect = document.getElementById('demo-key');
  const title = document.getElementById('demo-title');
  const subtitle = document.getElementById('demo-subtitle');
  const chordTabs = document.getElementById('demo-chords');
  const keyboard = document.getElementById('demo-keyboard');
  const formula = document.getElementById('demo-formula');
  const voicingButtons = demo.querySelectorAll('[data-voicing]');

  const state = { voicing: 'a', key: 'C', chord: 0 };
  let keys = new Map();
  let autoplay = null;

  for (const tonic of Object.keys(voicings.a)) {
    const option = document.createElement('option');
    option.value = tonic;
    option.textContent = `${tonic} major`;
    keySelect.append(option);
  }

  const progression = () => voicings[state.voicing][state.key];

  const element = (name, attributes) => {
    const node = document.createElementNS(SVG, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  };

  // Draws the keys covering every note of the progression, a white key of
  // margin each side, so the keyboard stays still while the chords change
  // and its keys stay as big as the width allows.
  const drawKeyboard = () => {
    const pitches = progression().flatMap((chord) => chord.notes.map((note) => note.pitch));
    let low = Math.min(...pitches) - 1;
    while (BLACK.has(low % 12)) low--;
    let high = Math.max(...pitches) + 1;
    while (BLACK.has(high % 12)) high++;

    const whites = [];
    for (let pitch = low; pitch <= high; pitch++) if (!BLACK.has(pitch % 12)) whites.push(pitch);
    const width = whites.length * WHITE_W;
    const svg = element('svg', {
      viewBox: `0 0 ${width} ${WHITE_H}`,
      role: 'img',
      'aria-label': 'Piano keyboard',
    });
    const whiteLayer = element('g', {});
    const blackLayer = element('g', {});
    svg.append(whiteLayer, blackLayer);

    keys = new Map();
    let x = 0;
    for (let pitch = low; pitch <= high; pitch++) {
      const black = BLACK.has(pitch % 12);
      const keyX = black ? x - BLACK_W / 2 : x;
      const w = black ? BLACK_W : WHITE_W;
      const h = black ? BLACK_H : WHITE_H;
      const group = element('g', {});
      const rect = element('rect', {
        x: keyX + 0.5,
        y: 0.5,
        width: w - 1,
        height: h - 1,
        rx: black ? 2 : 3,
        class: black ? 'key-black' : 'key-white',
      });
      const root = element('circle', {
        cx: keyX + w / 2,
        cy: black ? 40 : 76,
        r: 2.4,
        class: 'key-root',
      });
      const label = element('text', {
        x: keyX + w / 2,
        y: black ? 54 : 92,
        class: 'key-label',
      });
      group.append(rect, root, label);
      (black ? blackLayer : whiteLayer).append(group);
      keys.set(pitch, { rect, root, label });
      if (!black) x += WHITE_W;
    }
    keyboard.replaceChildren(svg);
  };

  const showChord = () => {
    const chords = progression();
    const chord = chords[state.chord];

    chordTabs.querySelectorAll('button').forEach((button, index) => {
      button.setAttribute('aria-selected', String(index === state.chord));
      button.tabIndex = index === state.chord ? 0 : -1;
    });

    for (const { rect, root, label } of keys.values()) {
      rect.classList.remove('is-lit', 'is-left');
      root.classList.remove('is-shown');
      label.classList.remove('is-shown');
    }
    for (const note of chord.notes) {
      const key = keys.get(note.pitch);
      if (!key) continue;
      key.rect.classList.add('is-lit');
      if (note.left) key.rect.classList.add('is-left');
      if (note.role === 'R') key.root.classList.add('is-shown');
      key.label.textContent = note.name;
      key.label.classList.add('is-shown');
    }

    const right = chord.notes.filter((note) => !note.left).map((note) => note.role);
    const form = chord.form ? `${chord.form} voicing · ` : '';
    formula.innerHTML = '';
    const bold = document.createElement('b');
    bold.textContent = `${chord.root}${SUFFIX[chord.type] ?? ''}`;
    formula.append(bold, ` · ${form}${right.join(' ')}`);
  };

  const render = () => {
    title.textContent = `ii–V–I in ${state.key} major`;
    subtitle.textContent = SUBTITLES[state.voicing];
    voicingButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.voicing === state.voicing));
    });

    chordTabs.replaceChildren(
      ...progression().map((chord, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('role', 'tab');
        const numeral = document.createElement('span');
        numeral.textContent = chord.numeral;
        const symbol = document.createElement('strong');
        symbol.textContent = `${chord.root}${SUFFIX[chord.type] ?? ''}`;
        button.append(numeral, symbol);
        button.addEventListener('click', () => {
          stopAutoplay();
          state.chord = index;
          showChord();
        });
        return button;
      }),
    );
    drawKeyboard();
    showChord();
  };

  // Arrow keys move between the chord tabs.
  chordTabs.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    stopAutoplay();
    state.chord = (state.chord + step + 3) % 3;
    showChord();
    chordTabs.querySelectorAll('button')[state.chord].focus();
  });

  voicingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      stopAutoplay();
      state.voicing = button.dataset.voicing;
      render();
    });
  });

  keySelect.addEventListener('change', () => {
    stopAutoplay();
    state.key = keySelect.value;
    render();
  });

  // Plays through the cadence on its own until the visitor takes over.
  const stopAutoplay = () => {
    if (autoplay) clearInterval(autoplay);
    autoplay = null;
  };

  const startAutoplay = () => {
    if (reducedMotion || autoplay) return;
    autoplay = setInterval(() => {
      state.chord = (state.chord + 1) % 3;
      showChord();
    }, 1600);
  };

  render();

  if ('IntersectionObserver' in window) {
    let started = false;
    new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !started) {
          started = true;
          startAutoplay();
        } else if (!entry.isIntersecting) {
          stopAutoplay();
        }
      }
    }, { threshold: 0.4 }).observe(demo);
  }
})();
