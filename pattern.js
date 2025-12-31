// 3am
stack(
  s("bd ~ [~ bd] ~, ~ cp ~ ~")
    .gain(0.65),

  s("hh(3,8)")
    .gain(0.15),

  note("d2 ~ ~ d2 ~ d2 ~ ~, ~ ~ f2 ~ ~ ~ a2 ~")
    .s("sawtooth")
    .lpf(350)
    .gain(0.45),

  note("~ ~ <d4 f4> ~")
    .s("sine")
    .phaser(0.8)
    .phaserdepth(0.6)
    .gain(0.25)
    .room(0.7)
    .delay(0.4),

  s("breaks165:0")
    .striate(8)
    .coarse(4)
    .lpf(2500)
    .gain(0.2)
).cpm(72)
