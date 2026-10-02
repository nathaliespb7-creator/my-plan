let audioCtx: AudioContext | null = null

export function unlockRestAudio(): void {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext()
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume()
    }
  } catch {
    /* ignore */
  }
}

export function playRestDoneBeep(): void {
  try {
    if (!audioCtx) {
      audioCtx = new AudioContext()
    }
    const ctx = audioCtx
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.15
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t = ctx.currentTime
    osc.start(t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.stop(t + 0.35)
  } catch {
    /* ignore */
  }
}
