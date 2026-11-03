// Site-wide settings. The base URL comes from VITE_SITE_URL in .env (one place for the whole site).
export const site = {
  name: 'FASTAG GUIDE',
  url: (import.meta.env.VITE_SITE_URL as string).replace(/\/+$/, ''),
  // Who runs the site. Shown in the footer and in structured data.
  publisher: { name: 'Technokari', url: 'https://tools.technokari.com' },
  // Leave empty to hide the Contact link until a real address is set.
  contactEmail: '',
  official: {
    rajmargYatra: 'https://rajmargyatra.nhai.gov.in/',
    rajmargYatraLocalPass: 'https://rajmargyatra.nhai.gov.in/buy-fastag-local-pass',
    nhaiOneVehicle: 'https://nhai.gov.in/nhai/sites/default/files/2024-01/Press_Release-One_Vehical_One_FASTag_0.pdf',
    nhaiKyv2026: 'https://nhai.gov.in/nhai/sites/default/files/2026-01/NHAI_Press_Release-01-01-2026-Eng.pdf',
  },
  nhaiHelpline: '1033',
}
