// @ts-check
const lightCodeTheme = require("prism-react-renderer").themes.github;
const darkCodeTheme = require("prism-react-renderer").themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "TyForge - Documentacao Tecnica",
  tagline: "Type-safe schema validation, Result pattern e DDD building blocks para TypeScript",
  favicon: "img/favicon.ico",
  url: "https://tyforge.navegarsistemas.com.br",
  baseUrl: "/",
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
          id: "guia",
          path: "docs/guia",
          routeBasePath: "guia",
          sidebarPath: require.resolve("./sidebars.ts"),
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "contribuindo",
        path: "docs/contribuindo",
        routeBasePath: "contribuindo",
        sidebarPath: require.resolve("./sidebarsContribuindo.ts"),
        editUrl: undefined,
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
          to: "/guia/introducao",
          label: "Guia",
          position: "left",
        },
        {
          to: "/contribuindo/arquitetura",
          label: "Contribuindo",
          position: "left",
        },
        {
          href: "https://github.com/navegar-sistemas/tyforge",
          label: "GitHub",
          position: "right",
        },
        {
          href: "https://www.npmjs.com/package/@navegar-sistemas/tyforge",
          label: "npm",
          position: "right",
        },
        {
          href: "https://navegarsistemas.com.br/opensource/tyforge/",
          label: "Navegar Sistemas",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentacao",
          items: [
            { label: "Guia", to: "/guia/introducao" },
            { label: "Contribuindo", to: "/contribuindo/arquitetura" },
          ],
        },
        {
          title: "Links",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/navegar-sistemas/tyforge",
            },
            {
              label: "npm",
              href: "https://www.npmjs.com/package/@navegar-sistemas/tyforge",
            },
          ],
        },
        {
          title: "Institucional",
          items: [
            {
              label: "Navegar Sistemas",
              href: "https://navegarsistemas.com.br/",
            },
            {
              label: "Projeto",
              href: "https://navegarsistemas.com.br/opensource/tyforge/",
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
