const SNIPPET = `
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  consent: 'default',
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'granted'
});
try {
  var stored = JSON.parse(localStorage.getItem('dcc-cookie-consent') || 'null');
  if (stored && stored.analytics !== undefined) {
    window.dataLayer.push({
      consent: 'update',
      ad_storage: stored.marketing ? 'granted' : 'denied',
      analytics_storage: stored.analytics ? 'granted' : 'denied',
      ad_user_data: stored.marketing ? 'granted' : 'denied',
      ad_personalization: stored.marketing ? 'granted' : 'denied',
      functionality_storage: 'granted',
      personalization_storage: stored.analytics ? 'granted' : 'denied',
      security_storage: 'granted'
    });
  }
} catch (e) {}
`

export function ConsentModeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SNIPPET }} />
}
