import * as migration_20261110_022037_initial from './20261110_022037_initial';

export const migrations = [
  {
    up: migration_20261110_022037_initial.up,
    down: migration_20261110_022037_initial.down,
    name: '20261110_022037_initial'
  },
];
