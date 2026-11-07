// Monte-Carlo check of the placement test: simulated learners of known ability take the test.
import { Placement, prob, SELF } from '../../app/js/engine/placement.js';
import { levelOf } from '../../app/js/engine/adapt.js';

const selfFor = (t) => (t < -2.8 ? 'none' : t < -1.6 ? 'hangul' : t < -0.4 ? 'basic' : t < 1.5 ? 'conversation' : 'advanced');
const runs = 300;
console.log('true θ | self-report | mean est | RMSE | mean items | level hit-rate');
for (const trueT of [-3.5, -2.5, -2.0, -1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]) {
  for (const honest of [true, false]) {
    let se2 = 0, sum = 0, items = 0, hit = 0;
    for (let r = 0; r < runs; r++) {
      // dishonest = self-report one band off (tests robustness to a bad prior)
      const keys = Object.keys(SELF);
      let k = selfFor(trueT);
      if (!honest) k = keys[Math.min(keys.length - 1, keys.indexOf(k) + 1)];
      const p = new Placement(k);
      let it;
      while ((it = p.next())) p.answer(it, Math.random() < prob(trueT, it));
      const res = p.result();
      se2 += (res.theta - trueT) ** 2; sum += res.theta; items += res.n;
      if (levelOf(res.theta).level === levelOf(trueT).level) hit++;
    }
    console.log(`${String(trueT).padStart(5)} | ${honest ? 'honest   ' : 'one-up   '} | ${(sum / runs).toFixed(2).padStart(6)} | ${Math.sqrt(se2 / runs).toFixed(2)} | ${(items / runs).toFixed(1).padStart(5)} | ${Math.round((hit / runs) * 100)}%`);
  }
}
