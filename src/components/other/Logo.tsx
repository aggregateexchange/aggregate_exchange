import React from 'react';
import styles from './Logo.module.css';

const Logo: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <img src="/agg_logo_3_no_bg.png" alt="Aggregate Logo" className={styles.logoImage} />
        <div className={styles.logoText}>Aggregate</div>
      </div>
      <div className={styles.bottomLinksContainer}>
        <div className={styles.bottomSwaggerLinkContainer}>
          <a href="https://www.aggregate.exchange/swagger-api" target="_blank" rel="noopener noreferrer" className={styles.bottomSwaggerLink}>
            <img src="/images/swagger.png" alt="Swagger Logo" className={styles.bottomSwaggerImage} />
          </a>
        </div>
        <div className={styles.bottomLeftLinkContainer}>
          <a href="https://aggregate.gitbook.io/aggregate" target="_blank" rel="noopener noreferrer" className={styles.bottomLeftLink}>
            <img src="/images/gitbook.png" alt="GitBook Logo" className={styles.bottomLeftImage} />
          </a>
        </div>
        <div className={styles.bottomDiscordLinkContainer}>
          <a href="https://discord.gg/XJBzEnGH4z" target="_blank" rel="noopener noreferrer" className={styles.bottomDiscordLink}>
            <img src="/images/discord.png" alt="Discord Logo" className={styles.bottomDiscordImage} />
          </a>
        </div>
        <div className={styles.bottomRightLinkContainer}>
          <a href="https://x.com/Aggregate_ex" target="_blank" rel="noopener noreferrer" className={styles.bottomRightLink}>
            <img src="/images/twitter.png" alt="Twitter Logo" className={styles.bottomRightImage} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Logo;