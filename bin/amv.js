#!/usr/bin/env node

import('../dist/cli/index.js')
  .then(({ cli }) => {
    cli(process.argv.slice(2));
  })
  .catch(error => {
    console.error('Failed to start amv:', error);
    process.exit(1);
  });