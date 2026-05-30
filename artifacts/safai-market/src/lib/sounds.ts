let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch {
    // Audio not available — fail silently
  }
}

export const sounds = {
  click: () => playTone(800, 0.05, "square", 0.15),

  cartAdd: () => {
    playTone(880, 0.08, "sine", 0.2);
    setTimeout(() => playTone(1100, 0.08, "sine", 0.2), 90);
  },

  scanSuccess: () => {
    playTone(1320, 0.06, "sine", 0.25);
    setTimeout(() => playTone(1760, 0.12, "sine", 0.2), 60);
  },

  billSuccess: () => {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.15, "sine", 0.2), i * 80);
    });
  },

  error: () => {
    playTone(200, 0.12, "sawtooth", 0.25);
    setTimeout(() => playTone(150, 0.15, "sawtooth", 0.2), 120);
  },

  notification: () => playTone(660, 0.2, "sine", 0.15),
};

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem("safai-sounds-enabled") !== "false";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem("safai-sounds-enabled", String(enabled));
  } catch {}
}

export function playSound(name: keyof typeof sounds) {
  if (isSoundEnabled()) sounds[name]();
}
