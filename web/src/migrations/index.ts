import * as migration_20261110_022037_initial from './20261110_022037_initial';
import * as migration_20261111_114327_identitas_penerbit from './20261111_114327_identitas_penerbit';

export const migrations = [
  {
    up: migration_20261110_022037_initial.up,
    down: migration_20261110_022037_initial.down,
    name: '20261110_022037_initial',
  },
  {
    up: migration_20261111_114327_identitas_penerbit.up,
    down: migration_20261111_114327_identitas_penerbit.down,
    name: '20261111_114327_identitas_penerbit'
  },
];
