"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
var jsx_runtime_1 = require("react/jsx-runtime");
var Link_1 = __importDefault(require("@docusaurus/Link"));
var Layout_1 = __importDefault(require("@theme/Layout"));
var index_module_css_1 = __importDefault(require("./index.module.css"));
function HomepageHeader() {
    return ((0, jsx_runtime_1.jsxs)("header", { className: index_module_css_1.default.heroBanner, children: [(0, jsx_runtime_1.jsx)("div", { className: index_module_css_1.default.heroGrid }), (0, jsx_runtime_1.jsx)("div", { className: index_module_css_1.default.heroGlow }), (0, jsx_runtime_1.jsxs)("div", { className: "container", style: { position: 'relative', zIndex: 1 }, children: [(0, jsx_runtime_1.jsx)("span", { className: index_module_css_1.default.heroLabel, children: "TYPE-SAFE VALIDATION LIBRARY" }), (0, jsx_runtime_1.jsx)("h1", { className: index_module_css_1.default.heroTitle, children: "TyForge" }), (0, jsx_runtime_1.jsx)("p", { className: index_module_css_1.default.heroSubtitle, children: "Validacao de schemas type-safe, Result pattern e building blocks DDD para TypeScript." }), (0, jsx_runtime_1.jsx)("code", { className: index_module_css_1.default.heroInstall, children: "npm install tyforge" }), (0, jsx_runtime_1.jsxs)("div", { className: index_module_css_1.default.heroButtons, children: [(0, jsx_runtime_1.jsx)(Link_1.default, { className: index_module_css_1.default.btnPrimary, to: "/guia/introducao", children: "Ver Documentacao" }), (0, jsx_runtime_1.jsx)(Link_1.default, { className: index_module_css_1.default.btnOutline, to: "https://github.com/navegar-sistemas/tyforge", children: "GitHub" })] })] })] }));
}
var features = [
    {
        title: 'Result Pattern',
        description: 'Error handling funcional sem try/catch. ok(), err(), map, flatMap, fold, match e all com inferencia completa.',
    },
    {
        title: 'Schema Builder',
        description: 'Validacao compilada de schemas com inferencia de tipos. Modos create (completo) e assign (parcial).',
    },
    {
        title: 'Type Fields',
        description: '25+ Value Objects validadores pre-construidos: FString, FEmail, FId, FInt, FDate e muito mais.',
    },
    {
        title: 'Domain Models',
        description: 'Building blocks DDD: Entity, ValueObject, Aggregate com domain events e Dto com suporte HTTP.',
    },
    {
        title: 'Exceptions',
        description: '18 tipos de excecao RFC 7807 com stack trace lazy e factory methods para cenarios comuns.',
    },
    {
        title: 'Type-Safe',
        description: 'Inferencia de tipos completa em todo o pipeline — do JSON de entrada aos props validados.',
    },
];
function Home() {
    return ((0, jsx_runtime_1.jsxs)(Layout_1.default, { title: "TyForge - Navegar Sistemas", description: "Documentacao tecnica do TyForge: validacao type-safe, Result pattern, DDD building blocks para TypeScript.", children: [(0, jsx_runtime_1.jsx)(HomepageHeader, {}), (0, jsx_runtime_1.jsx)("main", { className: index_module_css_1.default.mainSection, children: (0, jsx_runtime_1.jsx)("div", { className: "container", children: (0, jsx_runtime_1.jsx)("div", { className: index_module_css_1.default.featuresGrid, children: features.map(function (feature, idx) { return ((0, jsx_runtime_1.jsxs)("div", { className: index_module_css_1.default.featureCard, children: [(0, jsx_runtime_1.jsx)("h3", { className: index_module_css_1.default.featureTitle, children: feature.title }), (0, jsx_runtime_1.jsx)("p", { className: index_module_css_1.default.featureDescription, children: feature.description })] }, idx)); }) }) }) })] }));
}
