/**
 * A synthesised ship's horn playing the opening phrase of "When You Wish Upon a Star".
 * Brassy layered oscillators through a low-pass filter, plus a long reverb so it
 * sounds like it is carrying across the water.
 */
const MELODY: [freq: number, beats: number][] = [
  [146.83, 1.2], // When  (D3)
  [293.66, 1.2], // you   (D4)
  [261.63, 1], //   wish  (C4)
  [246.94, 1], //   up-   (B3)
  [207.65, 1], //   on    (G#3)
  [220.0, 1], //    a     (A3)
  [329.63, 3.6], // star  (E4)
]
const BEAT = 0.42

let ctx: AudioContext | null = null
let playingUntil = 0

function reverb(ac: AudioContext, seconds = 3.2) {
  const len = Math.floor(ac.sampleRate * seconds)
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4)
  }
  const node = ac.createConvolver()
  node.buffer = buf
  return node
}

export function playHorn() {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  ctx ??= new AC()
  const ac = ctx
  if (ac.state === 'suspended') void ac.resume()
  if (ac.currentTime < playingUntil) return

  const master = ac.createGain()
  master.gain.value = 0.32
  const wet = ac.createGain()
  wet.gain.value = 0.45
  const verb = reverb(ac)
  master.connect(ac.destination)
  master.connect(verb)
  verb.connect(wet)
  wet.connect(ac.destination)

  let t = ac.currentTime + 0.05
  for (const [freq, beats] of MELODY) {
    const dur = beats * BEAT
    const env = ac.createGain()
    const filter = ac.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(500, t)
    filter.frequency.linearRampToValueAtTime(1400, t + 0.12)
    filter.Q.value = 1.2
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(1, t + 0.07)
    env.gain.setValueAtTime(1, t + dur - 0.08)
    env.gain.linearRampToValueAtTime(0, t + dur + 0.12)
    filter.connect(env)
    env.connect(master)

    // Body, a slightly detuned twin, a sub-octave and a soft fifth for that chord-like horn.
    const voices: [OscillatorType, number, number][] = [
      ['sawtooth', freq, 0.5],
      ['sawtooth', freq * 1.004, 0.4],
      ['square', freq / 2, 0.28],
      ['sawtooth', freq * 1.5, 0.12],
    ]
    for (const [type, f, g] of voices) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = type
      osc.frequency.value = f
      gain.gain.value = g
      osc.connect(gain)
      gain.connect(filter)
      osc.start(t)
      osc.stop(t + dur + 0.2)
    }
    t += dur
  }
  playingUntil = t
}
