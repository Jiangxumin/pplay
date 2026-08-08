import { littleEarsStopUrl, stopLittleEars } from '../littleEars';

describe('littleEarsStopUrl', () => {
  it('uses the same host as baseURL, on port 3000 with /api/stop', () => {
    expect(littleEarsStopUrl('http://192.168.1.100:8080'))
      .toBe('http://192.168.1.100:3000/api/stop');
  });

  it('adds port 3000 when baseURL has no port', () => {
    expect(littleEarsStopUrl('http://192.168.1.100'))
      .toBe('http://192.168.1.100:3000/api/stop');
  });

  it('ignores a trailing slash or path on baseURL', () => {
    expect(littleEarsStopUrl('http://192.168.1.100:8080/manifest.json'))
      .toBe('http://192.168.1.100:3000/api/stop');
  });

  it('returns null for an empty baseURL', () => {
    expect(littleEarsStopUrl('')).toBeNull();
  });
});

describe('stopLittleEars', () => {
  it('POSTs to the derived stop URL', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any);
    await stopLittleEars('http://192.168.1.100:8080');
    expect(spy).toHaveBeenCalledWith('http://192.168.1.100:3000/api/stop', { method: 'POST' });
    spy.mockRestore();
  });

  it('does nothing when baseURL is empty', async () => {
    const spy = jest.spyOn(global, 'fetch');
    await stopLittleEars('');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('swallows network failures silently', async () => {
    const spy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network'));
    await expect(stopLittleEars('http://192.168.1.100:8080')).resolves.toBeUndefined();
    spy.mockRestore();
  });
});
