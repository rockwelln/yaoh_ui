import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Easy to Use',
    Svg: require('@site/static/img/undraw_relax.svg').default,
    description: (
      <>
        APIO was designed from the ground up to be easily configured and
        used to get your API up and running quickly.
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    Svg: require('@site/static/img/undraw_focus.svg').default,
    description: (
      <>
        APIO lets you focus on your business processes, and we&apos;ll do the chores. Go
        ahead and move your processes into workflows.
      </>
    ),
  },
  {
    title: 'Made with love',
    Svg: require('@site/static/img/undraw_love.svg').default,
    description: (
      <>
        APIO is made with love by a team of developers who love to make
        APIs. We&apos;re always looking for contributors, ideas or suggestions to help us make APIO
        better.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
