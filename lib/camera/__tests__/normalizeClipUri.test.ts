import { normalizeClipUri } from '../normalizeClipUri';

describe('normalizeClipUri', () => {
  it('keeps file:// URIs', () => {
    expect(normalizeClipUri('file:///data/user/0/cache/video.mp4')).toMatch(/^file:\/\//);
  });

  it('prefixes absolute paths', () => {
    expect(normalizeClipUri('/data/user/0/cache/video.mp4')).toBe(
      'file:///data/user/0/cache/video.mp4',
    );
  });
});
