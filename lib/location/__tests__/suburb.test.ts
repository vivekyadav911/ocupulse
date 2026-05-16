import { suburbFromGeocode } from '../../../hooks/useLocation';

describe('suburbFromGeocode', () => {
  it('prefers district then subregion then city', () => {
    expect(
      suburbFromGeocode({
        district: 'Bundoora',
        subregion: 'Melbourne',
        city: 'Melbourne',
        name: null,
        region: 'VIC',
        country: 'Australia',
        street: null,
        postalCode: null,
        isoCountryCode: 'AU',
        streetNumber: null,
        timezone: null,
        formattedAddress: null,
      } as never),
    ).toBe('Bundoora');
    expect(suburbFromGeocode({ city: 'Sydney', subregion: 'NSW' } as never)).toBe('NSW');
  });
});
