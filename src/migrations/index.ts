import * as migration_20260719_131233 from './20260719_131233';
import * as migration_20260719_add_image_url from './20260719_add_image_url';
import * as migration_20260719_add_product_state from './20260719_add_product_state';
import * as migration_20260720_add_is_visible from './20260720_add_is_visible';
import * as migration_20260802_202035 from './20260802_202035';
import * as migration_20260807_add_unique_stripe_session from './20260807_add_unique_stripe_session';
import * as migration_20260809_google_schema from './20260809_google_schema';
import * as migration_20260810_remove_users_name from './20260810_remove_users_name';
import * as migration_20260810_add_purchases from './20260810_add_purchases';
import * as migration_20260812_purchases_lines_schema from './20260812_purchases_lines_schema';
import * as migration_20260812_fix_locked_documents_rels from './20260812_fix_locked_documents_rels';
import * as migration_20260812_align_orders_stripe_session_index from './20260812_align_orders_stripe_session_index';

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
  {
    up: migration_20260810_add_purchases.up,
    down: migration_20260810_add_purchases.down,
    name: '20260810_add_purchases'
  },
  {
    up: migration_20260812_purchases_lines_schema.up,
    down: migration_20260812_purchases_lines_schema.down,
    name: '20260812_purchases_lines_schema'
  },
  {
    up: migration_20260812_fix_locked_documents_rels.up,
    down: migration_20260812_fix_locked_documents_rels.down,
    name: '20260812_fix_locked_documents_rels'
  },
  {
    up: migration_20260812_align_orders_stripe_session_index.up,
    down: migration_20260812_align_orders_stripe_session_index.down,
    name: '20260812_align_orders_stripe_session_index'
  },
];
