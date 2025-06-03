import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  description: "Tracewright a regression test automation agent for Playwright",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      // { text: 'Home', link: '/' },
      // { text: 'Examples', link: '/markdown-examples' }
    ],

    // sidebar: [
    //   {
    //     text: 'Examples',
    //     items: [
    //       { text: 'Markdown Examples', link: '/markdown-examples' },
    //       { text: 'Runtime API Examples', link: '/api-examples' }
    //     ]
    //   }
    // ],
    logo: {
      src: './tracewright-blue.png',
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
