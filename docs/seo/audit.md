# SEO & GEO Audit Brief: darkcardcollection.com
**Score: 70% (Grade C)** · Checked: 4 Aug 2026

Agent instructions: fix every issue listed below. Work through the priority fixes first, then the failing checks by category. Do not change items listed under "Passing".

## Priority fixes

1. **[Severe] `Organization` (or subtype) schema present**
   Example:
```
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.example.com/#organization",
  "name": "Example Co",
  "url": "https://www.example.com/",
  "sameAs": ["https://www.linkedin.com/company/example"]
}
```

2. **[Severe] First/hero image does NOT use `loading="lazy"`** — First image has loading="lazy" — may delay LCP
   Fix: Remove `loading="lazy"` from above-fold images. Add `fetchpriority="high"` to your hero image to prioritise it further.
   Example:
```
<!-- Hero image: no lazy, high priority -->
<img src="hero.webp" fetchpriority="high" width="1200" height="600" alt="Hero" />
```

3. **[Severe] AI crawlers explicitly allowed (GPTBot / ClaudeBot / etc.)**
   Example:
```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
```

4. **[Severe] `/llms.txt` exists and returns 200**
   Example:
```
# Company Name
> One-sentence description of what you do.

## Services
- [Service Name](https://example.com/service/) - Brief description

## Team
- Jane Smith, Founder — https://www.linkedin.com/in/jane

## Key pages
- [Blog](https://example.com/blog/)
- [About](https://example.com/about/)
```

5. **[Severe] `max-snippet:-1` in robots meta**
   Example:
```
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
```

6. **[Medium] `max-snippet` and `max-image-preview` set** — Missing max-snippet or max-image-preview
   Fix: Add both directives to your robots meta tag.
   Example:
```
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
```

7. **[Medium] Organization schema has `name`, `url`, `address`, `sameAs`**
   Example:
```
{
  "@type": "Organization",
  "name": "Example Co",
  "url": "https://www.example.com/",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Vienna",
    "addressCountry": "AT"
  },
  "sameAs": [
    "https://www.linkedin.com/company/example",
    "https://www.wikidata.org/wiki/Q..."
  ]
}
```

8. **[Medium] Images served in WebP or AVIF format**
   Fix: Convert images at build time or via your CDN's image optimisation. Use `<picture>` for format negotiation with JPEG fallback.
   Example:
```
<picture>
  <source srcset="hero.avif" type="image/avif" />
  <source srcset="hero.webp" type="image/webp" />
  <img src="hero.jpg" alt="Hero image" width="1200" height="600" />
</picture>
```

9. **[Medium] All `<img>` tags have `width` and `height` attributes**
   Fix: Add `width` and `height` attributes matching the image's intrinsic size. Use CSS to control display size.
   Example:
```
<img src="hero.webp" width="1200" height="600" alt="Dashboard screenshot" />
```

10. **[Medium] `og:locale` declared**
   Example:
```
<meta property="og:locale" content="en_GB" />
```

11. **[Medium] `X-Content-Type-Options: nosniff`**
   Example:
```
# Nginx
add_header X-Content-Type-Options "nosniff" always;
```

12. **[Medium] `X-Frame-Options` present**
   Example:
```
add_header X-Frame-Options "SAMEORIGIN" always;
```

## Failing checks by category

### Title Tags (WARN — 89%)

- **Title is under 60 characters** — 63 characters [Low]
  Fix: Rewrite the title to lead with the most important keywords. Use a title preview tool to verify display length.

### Robots Meta Tag (WARN — 80%)

- **`max-snippet` and `max-image-preview` set** — Missing max-snippet or max-image-preview [Medium]
  Fix: Add both directives to your robots meta tag.
  Example:
  ```
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
  ```

### Structured Data / Schema.org (JSON-LD) (WARN — 63%)

- **`Organization` (or subtype) schema present** [Severe]
  Example:
  ```
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.example.com/#organization",
    "name": "Example Co",
    "url": "https://www.example.com/",
    "sameAs": ["https://www.linkedin.com/company/example"]
  }
  ```
- **Organization schema has `name`, `url`, `address`, `sameAs`** [Medium]
  Example:
  ```
  {
    "@type": "Organization",
    "name": "Example Co",
    "url": "https://www.example.com/",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Vienna",
      "addressCountry": "AT"
    },
    "sameAs": [
      "https://www.linkedin.com/company/example",
      "https://www.wikidata.org/wiki/Q..."
    ]
  }
  ```
- **`Person` schema present** [Low]
  Example:
  ```
  {
    "@type": "Person",
    "name": "Jane Smith",
    "jobTitle": "Founder",
    "url": "https://www.example.com/team/jane",
    "sameAs": ["https://www.linkedin.com/in/janesmith"]
  }
  ```

### Image Handling (WARN — 50%)

- **Images served in WebP or AVIF format** [Medium]
  Fix: Convert images at build time or via your CDN's image optimisation. Use `<picture>` for format negotiation with JPEG fallback.
  Example:
  ```
  <picture>
    <source srcset="hero.avif" type="image/avif" />
    <source srcset="hero.webp" type="image/webp" />
    <img src="hero.jpg" alt="Hero image" width="1200" height="600" />
  </picture>
  ```
- **All `<img>` tags have `width` and `height` attributes** [Medium]
  Fix: Add `width` and `height` attributes matching the image's intrinsic size. Use CSS to control display size.
  Example:
  ```
  <img src="hero.webp" width="1200" height="600" alt="Dashboard screenshot" />
  ```
- **First/hero image does NOT use `loading="lazy"`** — First image has loading="lazy" — may delay LCP [Severe]
  Fix: Remove `loading="lazy"` from above-fold images. Add `fetchpriority="high"` to your hero image to prioritise it further.
  Example:
  ```
  <!-- Hero image: no lazy, high priority -->
  <img src="hero.webp" fetchpriority="high" width="1200" height="600" alt="Hero" />
  ```

### Favicons & Web App Manifest (WARN — 83%)

- **`apple-touch-icon` linked** [Low]
  Example:
  ```
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  ```

### Hreflang / Internationalisation (WARN — 50%)

- **`hreflang` tags present (multilingual)** [Low]
  Example:
  ```
  <link rel="alternate" hreflang="en-gb" href="https://example.com/en-gb/page/" />
  <link rel="alternate" hreflang="de" href="https://example.com/de/page/" />
  <link rel="alternate" hreflang="x-default" href="https://example.com/page/" />
  ```
- **`og:locale` declared** [Medium]
  Example:
  ```
  <meta property="og:locale" content="en_GB" />
  ```

### Internal Linking & Crawlability (WARN — 89%)

- **`<noscript>` fallback present (for JS-heavy sites)** [Low]
  Example:
  ```
  <noscript>
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
  </noscript>
  ```

### Security Headers (FAIL — 27%)

- **`X-Content-Type-Options: nosniff`** [Medium]
  Example:
  ```
  # Nginx
  add_header X-Content-Type-Options "nosniff" always;
  ```
- **`X-Frame-Options` present** [Medium]
  Example:
  ```
  add_header X-Frame-Options "SAMEORIGIN" always;
  ```
- **`Referrer-Policy` present** [Low]
  Example:
  ```
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  ```
- **`Permissions-Policy` present** [Low]
  Example:
  ```
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  ```
- **`Content-Security-Policy` present** [Medium]

### Cache Headers (WARN — 57%)

- **Public pages are cacheable** — Cache-Control includes no-store [Medium]
- **`ETag` header present (efficient re-crawling)** — Google recommends ETag over Last-Modified for cache validation [Low]
  Fix: Enable ETag generation in your server or CDN. Most web servers support it by default — check if it's been disabled.
  Example:
  ```
  # Nginx — enable ETags (on by default, but sometimes disabled)
  etag on;
  ```

### robots.txt (WARN — 77%)

- **AI crawlers explicitly allowed (GPTBot / ClaudeBot / etc.)** [Severe]
  Example:
  ```
  User-agent: GPTBot
  Allow: /
  
  User-agent: ClaudeBot
  Allow: /
  
  User-agent: PerplexityBot
  Allow: /
  
  User-agent: Google-Extended
  Allow: /
  ```

### llms.txt (GEO) (FAIL — 0%)

- **`/llms.txt` exists and returns 200** [Severe]
  Example:
  ```
  # Company Name
  > One-sentence description of what you do.
  
  ## Services
  - [Service Name](https://example.com/service/) - Brief description
  
  ## Team
  - Jane Smith, Founder — https://www.linkedin.com/in/jane
  
  ## Key pages
  - [Blog](https://example.com/blog/)
  - [About](https://example.com/about/)
  ```
- **Referenced in `<head>` with `<link rel="alternate" type="text/plain">`** [Medium]
  Example:
  ```
  <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt" />
  ```
- **Contains company name/description in first 500 chars** [Low]
- **Lists at least one team member or content URL** [Low]

### security.txt (FAIL — 0%)

- **`/.well-known/security.txt` (or `/security.txt`) exists** [Medium]
- **`Contact:` field present** [Low]
  Example:
  ```
  Contact: mailto:security@example.com
  ```
- **`Expires:` field present and in the future** [Low]
  Example:
  ```
  Expires: 2027-01-01T00:00:00.000Z
  ```
- **`Canonical:` field present** [Low]
  Example:
  ```
  Canonical: https://www.example.com/.well-known/security.txt
  ```

### GEO: AI Bot Permissions (FAIL — 0%)

- **`GPTBot` (ChatGPT training crawler) explicitly allowed in robots.txt** [Medium]
  Example:
  ```
  User-agent: GPTBot
  Allow: /
  ```
- **`OAI-SearchBot` (ChatGPT Search crawler) explicitly allowed in robots.txt** [Medium]
  Example:
  ```
  User-agent: OAI-SearchBot
  Allow: /
  ```
- **`ClaudeBot` (Claude AI crawler) explicitly allowed in robots.txt** [Medium]
  Example:
  ```
  User-agent: ClaudeBot
  Allow: /
  
  User-agent: anthropic-ai
  Allow: /
  ```
- **`PerplexityBot` (Perplexity AI crawler) explicitly allowed in robots.txt** [Medium]
  Example:
  ```
  User-agent: PerplexityBot
  Allow: /
  ```
- **`Google-Extended` (Google AI / Gemini crawler) explicitly allowed in robots.txt** [Medium]
  Example:
  ```
  User-agent: Google-Extended
  Allow: /
  ```

### GEO: Structured Data for AI (JSON-LD Quality) (FAIL — 40%)

- **`sameAs` array on Organization schema** [Low]
  Example:
  ```
  "sameAs": [
    "https://www.linkedin.com/company/example",
    "https://www.wikidata.org/wiki/Q..."
  ]
  ```
- **`knowsAbout` array present on org schema** [Low]
  Example:
  ```
  "knowsAbout": [
    "Search Engine Optimisation",
    "Generative Engine Optimisation",
    "Technical SEO",
    "Structured Data"
  ]
  ```
- **`hasOfferCatalog` or `makesOffer` present** [Low]
  Example:
  ```
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "SEO & GEO Services",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Technical SEO Audit" } }
    ]
  }
  ```

### GEO: Content Structure for AI Citability (WARN — 78%)

- **Page has question-format headings (how/what/why)** [Medium]
  Fix: Rewrite section headings as questions. "Our Approach" → "How Does Our SEO Process Work?"

### GEO: AI-Intent Meta & Head Signals (FAIL — 30%)

- **`max-snippet:-1` in robots meta** [Severe]
  Example:
  ```
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  ```
- **`max-image-preview:large` in robots meta** [Medium]
- **`<link rel="alternate" type="text/plain" href="/llms.txt">` in `<head>`** [Medium]
  Example:
  ```
  <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt" />
  ```

### Review / Rating Schema (FAIL — 0%)

- **`AggregateRating` schema present** — No review content detected [Medium]
  Example:
  ```
  {
    "@type": "Product",
    "name": "Example Service",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "124",
      "bestRating": "5"
    }
  }
  ```

## Passing (no changes needed)

HTTPS & Canonical · Meta Description · Open Graph Tags · Twitter / X Card · Analytics / Consent Mode · Heading Hierarchy & Accessibility · Noindex Strategy · URL Structure · 404 Page · Sitemap · Breadcrumb Schema · Blog / Content Architecture · Performance Signals · AI Content Detection · Event Schema · Video Schema · AI Agent Accessibility

## PageSpeed Insights (mobile)

Performance: 99 · Accessibility: 93 · Best Practices: 100 · SEO: 100

## Email & DNS (informational — not scored)

- **`/humans.txt` exists**
- **File identifies at least one team member or creator**
- **`https://mta-sts.{domain}/.well-known/mta-sts.txt` exists**
- **`mode: enforce` set (not `testing`)**
- **`_mta-sts.{domain}` DNS TXT record present**
- **`max_age` field present**
- **SPF TXT record present on root domain**
- **SPF has `~all` or `-all` (not `+all`)**
- **DKIM record found at a common selector**
- **DKIM record contains a valid public key (`p=`)**
- **DMARC TXT record at `_dmarc.{domain}` present**
- **Policy is `p=quarantine` or `p=reject` (not `p=none`)**
- **Reporting address (`rua=`) configured**
