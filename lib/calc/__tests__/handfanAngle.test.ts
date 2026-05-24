import { angleBetweenVerticalDeg, baselineEndpoints, lineEndpoints } from '../handfanAngle';

describe('handfanAngle', () => {
  it('returns 0° when touch is directly above origin', () => {
    expect(angleBetweenVerticalDeg(100, 50, 100, 200)).toBe(0);
  });

  it('returns ~45° for equal horizontal and vertical offset', () => {
    expect(angleBetweenVerticalDeg(150, 150, 100, 200)).toBe(45);
  });

  it('returns 90° when touch is horizontal from origin', () => {
    expect(angleBetweenVerticalDeg(200, 200, 100, 200)).toBe(90);
  });

  it('clamps to 90° when touch is below origin', () => {
    expect(angleBetweenVerticalDeg(100, 250, 100, 200)).toBe(90);
  });

  it('lineEndpoints produces vertical line at 0°', () => {
    const line = lineEndpoints({ x: 50, y: 200 }, 100, 0);
    expect(line.x1).toBe(50);
    expect(line.x2).toBe(50);
    expect(line.y2).toBeLessThan(line.y1);
  });

  it('baselineEndpoints goes straight up', () => {
    const line = baselineEndpoints({ x: 50, y: 200 }, 100);
    expect(line.x1).toBe(50);
    expect(line.x2).toBe(50);
    expect(line.y2).toBe(100);
  });
});
