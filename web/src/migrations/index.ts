import * as migration_20261110_022037_initial from './20261110_022037_initial';
import * as migration_20261111_114327_identitas_penerbit from './20261111_114327_identitas_penerbit';
import * as migration_20261111_151059_penyuntingan_situs from './20261111_151059_penyuntingan_situs';
import * as migration_20261112_091708_teks_beranda_dan_email_redaksi from './20261112_091708_teks_beranda_dan_email_redaksi';
import * as migration_20261112_112900_huruf_situs from './20261112_112900_huruf_situs';

export const migrations = [
  {
    up: migration_20261110_022037_initial.up,
    down: migration_20261110_022037_initial.down,
    name: '20261110_022037_initial',
  },
  {
    up: migration_20261111_114327_identitas_penerbit.up,
    down: migration_20261111_114327_identitas_penerbit.down,
    name: '20261111_114327_identitas_penerbit',
  },
  {
    up: migration_20261111_151059_penyuntingan_situs.up,
    down: migration_20261111_151059_penyuntingan_situs.down,
    name: '20261111_151059_penyuntingan_situs',
  },
  {
    up: migration_20261112_091708_teks_beranda_dan_email_redaksi.up,
    down: migration_20261112_091708_teks_beranda_dan_email_redaksi.down,
    name: '20261112_091708_teks_beranda_dan_email_redaksi',
  },
  {
    up: migration_20261112_112900_huruf_situs.up,
    down: migration_20261112_112900_huruf_situs.down,
    name: '20261112_112900_huruf_situs'
  },
];
