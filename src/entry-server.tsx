// Build-time render: turns the page into real HTML so search engines, AI crawlers and link previews
// see the full content without running JavaScript. The browser then hydrates the same markup.
import { renderToString } from 'react-dom/server'
import App from './App'
import { I18nProvider, faqs } from './i18n'
import { site } from './config'
import { VERIFIED_ON } from './data/providers'

export function render() {
  return renderToString(
    <I18nProvider>
      <App />
    </I18nProvider>,
  )
}

export function structuredData() {
  const publisher = { '@type': 'Organization', name: site.publisher.name, url: site.publisher.url }
  return [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.url + '/', inLanguage: ['en-IN', 'hi-IN'], publisher },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'FASTag Local Pass, Annual Pass and FASTag Charges Compared',
      url: site.url + '/',
      inLanguage: 'en-IN',
      dateModified: VERIFIED_ON,
      isPartOf: { '@type': 'WebSite', url: site.url + '/' },
      publisher,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.en.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]
}
