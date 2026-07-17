import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  fields: [
    {
      name: 'siteName',
      type: 'text',
      defaultValue: 'Dark Card Collection',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue: 'Carte Pokemon rarity, edizioni limitate e molto altro',
    },
  ],
}
