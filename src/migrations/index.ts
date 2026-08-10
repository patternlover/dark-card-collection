import * as migration_20260719_131233 from './20260719_131233';
import * as migration_20260719_add_image_url from './20260719_add_image_url';
import * as migration_20260719_add_product_state from './20260719_add_product_state';
import * as migration_20260720_add_is_visible from './20260720_add_is_visible';
import * as migration_20260802_202035 from './20260802_202035';
import * as migration_20260807_add_unique_stripe_session from './20260807_add_unique_stripe_session';
import * as migration_20260809_google_schema from './20260809_google_schema';
import * as migration_20260810_remove_users_name from './20260810_remove_users_name';

export const migrations = [
  {
    up: migration_20260719_131233.up,
    down: migration_20260719_131233.down,
    name: '20260719_131233',
  },
  {
    up: migration_20260719_add_image_url.up,
    down: migration_20260719_add_image_url.down,
    name: '20260719_add_image_url',
  },
  {
    up: migration_20260719_add_product_state.up,
    down: migration_20260719_add_product_state.down,
    name: '20260719_add_product_state',
  },
  {
    up: migration_20260720_add_is_visible.up,
    down: migration_20260720_add_is_visible.down,
    name: '20260720_add_is_visible',
  },
  {
    up: migration_20260802_202035.up,
    down: migration_20260802_202035.down,
    name: '20260802_202035'
  },
  {
    up: migration_20260807_add_unique_stripe_session.up,
    down: migration_20260807_add_unique_stripe_session.down,
    name: '20260807_add_unique_stripe_session'
  },
  {
    up: migration_20260809_google_schema.up,
    down: migration_20260809_google_schema.down,
    name: '20260809_google_schema'
  },
  {
    up: migration_20260810_remove_users_name.up,
    down: migration_20260810_remove_users_name.down,
    name: '20260810_remove_users_name'
  },
];
