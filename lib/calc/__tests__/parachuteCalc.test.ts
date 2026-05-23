import {
  acceleration,
  calculate,
  contactTimeFromFrames,
  dragForce,
  finalVelocity,
  gForceBounce,
  gForceNoBounce,
  gForceRisk,
  netForce,
  vUpFromTime,
  weight,
} from '../parachuteCalc';

describe('parachuteCalc', () => {
  it('checklist: height=1.0, time=0.5, mass=0.20', () => {
    const v = finalVelocity(1.0, 0.5);
    expect(v).toBe(2.0);
    const a = acceleration(v!, 0.5);
    expect(a).toBe(4.0);
    const fNet = netForce(0.2, a!);
    expect(fNet).toBeCloseTo(0.8, 5);
    const w = weight(0.2);
    expect(w).toBeCloseTo(1.96, 5);
    const fDrag = dragForce(w!, fNet!);
    expect(fDrag).toBeCloseTo(1.16, 5);
  });

  it('calculate() full pipeline', () => {
    const r = calculate({
      heightM: 1.0,
      fallTimeS: 0.5,
      massKg: 0.2,
      contactTimeS: 0.05,
    });
    expect(r.finalVelocity).toBe(2.0);
    expect(r.acceleration).toBe(4.0);
    expect(r.netForce).toBeCloseTo(0.8, 5);
    expect(r.weight).toBeCloseTo(1.96, 5);
    expect(r.dragForce).toBeCloseTo(1.16, 5);
    expect(r.gForce).toBeCloseTo(4.08, 1);
    expect(r.riskLabel).toBe('No injury risk');
  });

  it('gForce no bounce: 2.0 m/s, 0.05 s ≈ 4.08 g', () => {
    const g = gForceNoBounce(2.0, 0.05);
    expect(g).toBeCloseTo(4.08, 1);
    expect(gForceRisk(g!)).toBe('No injury risk');
  });

  it('gForce bounce: impact=2.0, tUp=0.15, contact=0.02', () => {
    const vUp = vUpFromTime(0.15);
    expect(vUp).toBeCloseTo(1.47, 2);
    const g = gForceBounce(2.0, vUp!, 0.02);
    expect(g).toBeCloseTo(17.7, 0);
    expect(gForceRisk(g!)).toBe('Serious injury possible');
  });

  it('contactTimeFromFrames: 12→24 at 240 fps → 0.05 s', () => {
    expect(contactTimeFromFrames(12, 24, 240)).toBeCloseTo(0.05, 5);
  });

  it('returns null for invalid inputs', () => {
    expect(finalVelocity(0, 0.5)).toBeNull();
    expect(finalVelocity(1, 0)).toBeNull();
    expect(finalVelocity(-1, 0.5)).toBeNull();
    expect(gForceNoBounce(2, 0)).toBeNull();
    expect(contactTimeFromFrames(24, 12)).toBeNull();
    const r = calculate({ heightM: 0, fallTimeS: 0.5, massKg: 0.2, contactTimeS: 0.05 });
    expect(r.finalVelocity).toBeNull();
  });

  describe('gForceRisk boundaries', () => {
    it('returns Unknown below 1 g', () => {
      expect(gForceRisk(0.5)).toBe('Unknown');
    });
    it('5 g → Possible bruising', () => {
      expect(gForceRisk(5)).toBe('Possible bruising');
    });
    it('10 g → Serious injury possible', () => {
      expect(gForceRisk(10)).toBe('Serious injury possible');
    });
    it('30 g → High injury risk', () => {
      expect(gForceRisk(30)).toBe('High injury risk');
    });
    it('50 g → Life-threatening', () => {
      expect(gForceRisk(50)).toBe('Life-threatening');
    });
  });
});
