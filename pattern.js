stack(
  // cmaj7 arp, filter drifts
  note("c3 e3 g3 b3 c4 b3 g3 e3")
    .s("supersaw").distort(0.6)
    .lpf(perlin.slow(4).range(200, 1800))
    .lpenv(perlin.slow(5).range(1, 3))
    .gain(0.3).room(0.8),

  // doubled, slightly flat
  note("c3 e3 g3 b3 c4 b3 g3 e3")
    .s("supersaw").detune(-0.8)
    .lpf(perlin.slow(3).range(300, 1200))
    .gain(0.25).room(0.7),

  // slow root movement
  note("<c1 g1>").slow(8)
    .s("triangle").lpf(400)
    .gain(0.4).room(0.3),

  // rhythmic pulses underneath
  note("<a1 e2>").slow(16)
    .struct("x*4")
    .s("triangle").clip(0.9).lpf(800)
    .gain(0.2).room(0.4)
).cpm(42)
