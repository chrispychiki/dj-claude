// Late Night Drive

stack(
  // Kick with a bit of swing
  s("bd*4").gain(0.8),

  // Rim on the offbeats
  s("~ rim ~ rim").gain(0.4),

  // Shuffled hats
  s("hh(5,8)").gain(0.28),

  // Open hat accent
  s("~ ~ ~ oh").gain(0.3),

  // Deep bass in D minor
  note("d2 d2 a1 a1 bb1 bb1 c2 c2")
    .s("sawtooth")
    .lpf(350)
    .gain(0.6)
    .decay(0.2),

  // Rhodes chords: Dm - Am - Bb - C
  note("<[d3,f3,a3] [a2,c3,e3] [bb2,d3,f3] [c3,e3,g3]>")
    .s("gm_epiano2")
    .gain(0.38)
    .lpf(2200)
    .room(0.4),

  // Simple melody
  note("d4 f4 ~ e4 d4 ~ c4 a3")
    .s("gm_vibraphone")
    .gain(0.3)
    .room(0.5)
).cpm(108)
