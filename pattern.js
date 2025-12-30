stack(
  s("bd:3 ~ bd:3 ~, ~ ~ ~ sd:3").gain(0.9),
  s("hh*8").gain(0.3),
  note("<[d3,f3,a3] [c3,e3,g3] [a2,c3,e3] [g2,b2,d3]>").s("gm_epiano1").slow(2).gain(0.5),
  note("d2 ~ a2 ~, ~ f2 ~ c3").s("sawtooth").lpf(400).gain(0.5).slow(2),
  note("~ d5 ~ a4, f5 ~ ~ ~").s("sine").gain(0.2).slow(4)
).cpm(95)
