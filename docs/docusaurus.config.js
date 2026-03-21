// @ts-check
const lightCodeTheme = require("prism-react-renderer").themes.github;
const darkCodeTheme = require("prism-react-renderer").themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "TyForge - Documentacao Tecnica",
  tagline: "Type-safe schema validation, Result pattern e DDD building blocks para TypeScript",
  favicon: "img/favicon.ico",
  url: "https://navegarsistemas.github.io",
  baseUrl: "/tyforge/",
  organizationName: "Navegar Sistemas",
  projectName: "tyforge",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  customFields: {
    appVersion: "0.1.1",
  },
  i18n: {
    defaultLocale: "pt-BR",
    locales: ["pt-BR"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.ts"),
          editUrl: undefined,
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],
  themeConfig: {
    navbar: {
      logo: {
        alt: "Logo Navegar Sistemas",
        src: "img/logo.png",
      },
      items: [
        {
          href: "https://github.com/navegarsistemas/tyforge",
          label: "GitHub",
          position: "right",
        },
        {
          href: "https://www.npmjs.com/package/tyforge",
          label: "npm",
          position: "right",
        },
        {
          href: "https://www.navegarsistemas.com.br",
          label: "Site Oficial",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentacao",
          items: [{ label: "Inicio", to: "/" }],
        },
        {
          title: "Links",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/navegarsistemas/tyforge",
            },
            {
              label: "npm",
              href: "https://www.npmjs.com/package/tyforge",
            },
          ],
        },
        {
          title: "Institucional",
          items: [
            {
              label: "Navegar Sistemas",
              href: "https://www.navegarsistemas.com.br",
            },
            {
              label: "Contato",
              href: "mailto:contato@navegarsistemas.com.br",
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Navegar Sistemas. Todos os direitos reservados.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ["bash", "json", "yaml", "typescript"],
    },
    colorMode: {
      defaultMode: "dark",
      disableSwitch: false,
    },
  },
};

module.exports = config;
