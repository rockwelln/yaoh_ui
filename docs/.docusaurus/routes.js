import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/static/docs/api',
    component: ComponentCreator('/static/docs/api', 'e53'),
    exact: true
  },
  {
    path: '/static/docs/markdown-page',
    component: ComponentCreator('/static/docs/markdown-page', 'dff'),
    exact: true
  },
  {
    path: '/static/docs/search',
    component: ComponentCreator('/static/docs/search', 'cb2'),
    exact: true
  },
  {
    path: '/static/docs/docs',
    component: ComponentCreator('/static/docs/docs', '45f'),
    routes: [
      {
        path: '/static/docs/docs/administration/server_configuration',
        component: ComponentCreator('/static/docs/docs/administration/server_configuration', '26b'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/administration/setup',
        component: ComponentCreator('/static/docs/docs/administration/setup', '618'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/administration/templates',
        component: ComponentCreator('/static/docs/docs/administration/templates', '8c8'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/administration/webhooks',
        component: ComponentCreator('/static/docs/docs/administration/webhooks', '401'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/auth',
        component: ComponentCreator('/static/docs/docs/auth', 'cd4'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/category/administration',
        component: ComponentCreator('/static/docs/docs/category/administration', '4bf'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/category/advanced',
        component: ComponentCreator('/static/docs/docs/category/advanced', '6de'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/category/configuration',
        component: ComponentCreator('/static/docs/docs/category/configuration', 'f7f'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/category/history',
        component: ComponentCreator('/static/docs/docs/category/history', '56b'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/category/triggers',
        component: ComponentCreator('/static/docs/docs/category/triggers', '8d6'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/category/workflows',
        component: ComponentCreator('/static/docs/docs/category/workflows', '0ec'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/alarms',
        component: ComponentCreator('/static/docs/docs/configuration/alarms', '63b'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/cache',
        component: ComponentCreator('/static/docs/docs/configuration/cache', '7ad'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/cleanup',
        component: ComponentCreator('/static/docs/docs/configuration/cleanup', '14c'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/data stores',
        component: ComponentCreator('/static/docs/docs/configuration/data stores', '328'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/env',
        component: ComponentCreator('/static/docs/docs/configuration/env', '921'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/gateways',
        component: ComponentCreator('/static/docs/docs/configuration/gateways', '9e8'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/gui',
        component: ComponentCreator('/static/docs/docs/configuration/gui', '3d5'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/licenses',
        component: ComponentCreator('/static/docs/docs/configuration/licenses', '972'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/password',
        component: ComponentCreator('/static/docs/docs/configuration/password', 'ad4'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/provisioning',
        component: ComponentCreator('/static/docs/docs/configuration/provisioning', '7d9'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/smpp',
        component: ComponentCreator('/static/docs/docs/configuration/smpp', 'a5c'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/smtp',
        component: ComponentCreator('/static/docs/docs/configuration/smtp', 'ea0'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/sso',
        component: ComponentCreator('/static/docs/docs/configuration/sso', '846'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/configuration/tcp',
        component: ComponentCreator('/static/docs/docs/configuration/tcp', '963'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/history/requests',
        component: ComponentCreator('/static/docs/docs/history/requests', 'b45'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/history/scheduled_jobs',
        component: ComponentCreator('/static/docs/docs/history/scheduled_jobs', 'e63'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/history/timers',
        component: ComponentCreator('/static/docs/docs/history/timers', 'ac4'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/intro',
        component: ComponentCreator('/static/docs/docs/intro', 'cdb'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/migrations',
        component: ComponentCreator('/static/docs/docs/migrations', '3bc'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/triggers/bulk',
        component: ComponentCreator('/static/docs/docs/triggers/bulk', '655'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/triggers/custom_routes',
        component: ComponentCreator('/static/docs/docs/triggers/custom_routes', '580'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/triggers/scheduled_jobs',
        component: ComponentCreator('/static/docs/docs/triggers/scheduled_jobs', '917'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/workflows/advanced/entities',
        component: ComponentCreator('/static/docs/docs/workflows/advanced/entities', '0d5'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/workflows/advanced/manual_actions',
        component: ComponentCreator('/static/docs/docs/workflows/advanced/manual_actions', '235'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/workflows/advanced/versioning',
        component: ComponentCreator('/static/docs/docs/workflows/advanced/versioning', '9aa'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/workflows/nodes',
        component: ComponentCreator('/static/docs/docs/workflows/nodes', '4f1'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/workflows/templates',
        component: ComponentCreator('/static/docs/docs/workflows/templates', 'f85'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/static/docs/docs/workflows/zen',
        component: ComponentCreator('/static/docs/docs/workflows/zen', '484'),
        exact: true,
        sidebar: "tutorialSidebar"
      }
    ]
  },
  {
    path: '/static/docs/',
    component: ComponentCreator('/static/docs/', 'de2'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
