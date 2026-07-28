/* snapshot-test/client.config.js
 * Test environment for GHL builder snapshot verification.
 * GHL Location: 8iqYr9YNiaTcGdEKl6UU (Hot Tub Launch Retainer Snapshot)
 * Meta Pixel: 1257695509378686
 * Cloudflare Pages project: snapshot-test  →  snapshot-test.pages.dev
 * THIS IS A TEST ENVIRONMENT — not a real dealer site.
 */
window.CLIENT_CONFIG = {
  client: {
    name: 'Hot Tub Launch (Snapshot Test)',
    legalName: 'Hot Tub Launch Retainer Snapshot',
    market: 'Test Market',
    tagline: 'Snapshot system verification environment',
    primaryPhone: '555-000-0000',
    primaryPhoneHref: 'tel:+15550000000',
    smsHref: 'sms:+15550000000',
    address: '123 Test St, Test City, FL 00000',
    mapUrl: 'https://maps.google.com/?q=test',
    hours: 'Mon–Sat 9–6, Sun closed',
    websiteUrl: 'https://snapshot-test.pages.dev',
    storagePrefix: 'snapshot-test',
    email: 'test@snapshot-test.pages.dev',
    logoUrl: '',
    logoFooterUrl: '',
    mapEmbedUrl: '',
    facebookUrl: '',
    addressHtml: '123 Test St<br>Test City, FL 00000',
    hoursHtml: 'Mon–Sat 9–6<br>Sun closed',
    leadDisclaimer: 'By submitting, you agree Hot Tub Launch may call or text you at 555-000-0000 about your request. Msg/data rates may apply. Reply STOP to opt out.'
  },
  brand: {
    primary: '#0a2342',
    deep: '#061628',
    night: '#030d18',
    accent: '#c9a84c',
    urgent: '#c0392b'
  },
  tracking: {
    metaPixelId: '1257695509378686',
    ga4Id: '',
    clarityId: '',
    turnstileSiteKey: '',
    ghlExternalTracking: '',
    ghlBookingCalendarId: '',
    leadValue: '0',
    leadCurrency: 'USD'
  },
  endpoints: {
    lead: '/api/lead',
    inventory: '/api/inventory',
    admin: '/api/admin'
  },
  offers: {
    primary: 'Test Offer — Snapshot Verification',
    financing: 'Test financing copy',
    delivery: 'Test delivery copy',
    name: 'Snapshot Test Offer',
    headline: 'Test Headline',
    short: 'Test short offer',
    endsLabel: 'Offer ends',
    endsAt: '2099-12-31'
  },
  home: {
    heroImage: '',
    heroImageAlt: 'Test hero image',
    eyebrow: 'SNAPSHOT TEST',
    headline: 'Snapshot Verification Environment',
    headlineAccent: 'Test',
    subhead: 'This is a test environment for verifying the GHL snapshot system.',
    campaign: 'snapshot-test'
  }
};
