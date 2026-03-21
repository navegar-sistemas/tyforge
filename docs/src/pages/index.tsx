import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroGrid} />
      <div className={styles.heroGlow} />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <span className={styles.heroLabel}>TYPE-SAFE VALIDATION LIBRARY</span>
        <h1 className={styles.heroTitle}>
          TyForge
        </h1>
        <p className={styles.heroSubtitle}>
          Validacao de schemas type-safe, Result pattern e building blocks DDD para TypeScript.
        </p>
        <code className={styles.heroInstall}>npm install tyforge</code>
        <div className={styles.heroButtons}>
          <Link className={styles.btnPrimary} to="/introducao">
            Ver Documentacao
          </Link>
          <Link className={styles.btnOutline} to="https://github.com/navegarsistemas/tyforge">
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

type FeatureCard = {
  title: string;
  description: string;
};

const features: FeatureCard[] = [
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

export default function Home(): ReactNode {
  return (
    <Layout
      title="TyForge - Navegar Sistemas"
      description="Documentacao tecnica do TyForge: validacao type-safe, Result pattern, DDD building blocks para TypeScript."
    >
      <HomepageHeader />
      <main className={styles.mainSection}>
        <div className="container">
          <div className={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <div key={idx} className={styles.featureCard}>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
}
