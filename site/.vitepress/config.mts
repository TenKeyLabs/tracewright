import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // app level config options
  lang: 'en-US',
  title: 'Tracewright | Regression test automation agent for Playwright',
  description: "A regression test automation agent for Playwright",
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: 'Tracewright',
    logo: {
      light: './tracewright-icon-black.png',
      dark: './tracewright-icon-white.png',
      alt: 'Tracewright logo',
    },
    footer: {
      message: "Released under the Apache 2.0 License.",
      copyright: "© 2025 Ten Key Labs Incorporated DBA <a href='https://withmantle.com'>Mantle</a> and Tracewright contributors."
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/TenKeyLabs/tracewright' },
      { icon: 'x', link: 'https://x.com/withmantle' },
      { icon: 'linkedin', link: 'https://linkedin.com/company/withmantle' },
      { icon: 'bluesky', link: 'https://bsky.app/profile/did:plc:kxlpyb5fq52a34jmgazgkum7' }
    ]
  }
})
