export const G_STD = 9.8;
export const SLOW_MO_FPS = 240;

function invalid(...values: number[]): boolean {
  return values.some((v) => !Number.isFinite(v) || v <= 0);
}

export function finalVelocity(height: number, time: number): number | null {
  if (invalid(height, time)) return null;
  return height / time;
}

export function acceleration(finalV: number, time: number): number | null {
  if (invalid(finalV, time)) return null;
  return finalV / time;
}

export function netForce(mass: number, acc: number): number | null {
  if (invalid(mass, acc)) return null;
  return mass * acc;
}

export function weight(mass: number): number | null {
  if (invalid(mass)) return null;
  return mass * G_STD;
}

export function dragForce(w: number, net: number): number | null {
  if (!Number.isFinite(w) || !Number.isFinite(net) || w <= 0) return null;
  return w - net;
}

export function gForceNoBounce(impactSpeed: number, contactTime: number): number | null {
  if (invalid(impactSpeed, contactTime)) return null;
  return impactSpeed / contactTime / G_STD;
}

export function gForceBounce(impactSpeed: number, vUp: number, contactTime: number): number | null {
  if (invalid(impactSpeed, vUp, contactTime)) return null;
  return (impactSpeed + vUp) / contactTime / G_STD;
}

export function vUpFromTime(tUp: number): number | null {
  if (invalid(tUp)) return null;
  return G_STD * tUp;
}

export function contactTimeFromFrames(
  firstFrame: number,
  stoppedFrame: number,
  fps = SLOW_MO_FPS,
): number | null {
  if (
    !Number.isFinite(firstFrame) ||
    !Number.isFinite(stoppedFrame) ||
    !Number.isFinite(fps) ||
    firstFrame < 0 ||
    stoppedFrame < 0 ||
    fps <= 0 ||
    stoppedFrame <= firstFrame
  ) {
    return null;
  }
  return (stoppedFrame - firstFrame) / fps;
}

export function gForceRisk(gForce: number): string {
  if (!Number.isFinite(gForce) || gForce < 1) return 'Unknown';
  if (gForce < 5) return 'No injury risk';
  if (gForce < 10) return 'Possible bruising';
  if (gForce < 30) return 'Serious injury possible';
  if (gForce < 50) return 'High injury risk';
  return 'Life-threatening';
}

export type ParachuteCalcInputs = {
  heightM: number;
  fallTimeS: number;
  massKg: number;
  contactTimeS: number;
  hasBounce?: boolean;
  tUpS?: number;
};

export type ParachuteCalcResults = {
  finalVelocity: number | null;
  acceleration: number | null;
  netForce: number | null;
  weight: number | null;
  dragForce: number | null;
  gForce: number | null;
  vUp: number | null;
  riskLabel: string | null;
};

export function calculate(inputs: ParachuteCalcInputs): ParachuteCalcResults {
  const v = finalVelocity(inputs.heightM, inputs.fallTimeS);
  const a = v != null ? acceleration(v, inputs.fallTimeS) : null;
  const fNet = a != null ? netForce(inputs.massKg, a) : null;
  const w = weight(inputs.massKg);
  const fDrag = w != null && fNet != null ? dragForce(w, fNet) : null;

  let gForce: number | null = null;
  let vUp: number | null = null;

  if (v != null && inputs.contactTimeS > 0) {
    if (inputs.hasBounce && inputs.tUpS != null && inputs.tUpS > 0) {
      vUp = vUpFromTime(inputs.tUpS);
      gForce = vUp != null ? gForceBounce(v, vUp, inputs.contactTimeS) : null;
    } else {
      gForce = gForceNoBounce(v, inputs.contactTimeS);
    }
  }

  return {
    finalVelocity: v,
    acceleration: a,
    netForce: fNet,
    weight: w,
    dragForce: fDrag,
    gForce,
    vUp,
    riskLabel: gForce != null ? gForceRisk(gForce) : null,
  };
}

export type GForcePath = 'noBounce' | 'bounce';

export function gForceForPath(
  impactSpeed: number | null,
  contactTime: number | null,
  path: GForcePath,
  tUpS?: number | null,
): { gForce: number | null; vUp: number | null; riskLabel: string | null } {
  if (impactSpeed == null || contactTime == null) {
    return { gForce: null, vUp: null, riskLabel: null };
  }
  if (path === 'bounce' && tUpS != null && tUpS > 0) {
    const vUp = vUpFromTime(tUpS);
    const gForce = vUp != null ? gForceBounce(impactSpeed, vUp, contactTime) : null;
    return {
      gForce,
      vUp,
      riskLabel: gForce != null ? gForceRisk(gForce) : null,
    };
  }
  const gForce = gForceNoBounce(impactSpeed, contactTime);
  return {
    gForce,
    vUp: null,
    riskLabel: gForce != null ? gForceRisk(gForce) : null,
  };
}

export function fmtCalc(n: number | null | undefined, decimals = 2): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(decimals);
}

export function parsePositive(s: string): number | null {
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
