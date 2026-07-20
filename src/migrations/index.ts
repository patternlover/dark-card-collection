import * as migration_20260719_131233 from './20260719_131233';
import * as migration_20260720_add_is_visible from './20260720_add_is_visible';

export const migrations = [
  {
    up: migration_20260719_131233.up,
    down: migration_20260719_131233.down,
    name: '20260719_131233'
  },
  {
    up: migration_20260720_add_is_visible.up,
    down: migration_20260720_add_is_visible.down,
    name: '20260720_add_is_visible'
  },
];
