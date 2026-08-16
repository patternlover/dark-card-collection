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
import * as migration_20260813_espansioni_item_category from './20260813_espansioni_item_category';
import * as migration_20260814_item_category_hierarchy from './20260814_item_category_hierarchy';
import * as migration_20260814_item_category_remap from './20260814_item_category_remap';
import * as migration_20260814_categories_collection from './20260814_categories_collection';
import * as migration_20260814_remove_status_preorder from './20260814_remove_status_preorder';
import * as migration_20260815_item_category_2_hasmany from './20260815_item_category_2_hasmany';
import * as migration_20260815_cleanup_product_attrs from './20260815_cleanup_product_attrs';
import * as migration_20260815_lot_receipt_category_kind_drop_rarity from './20260815_lot_receipt_category_kind_drop_rarity';
import * as migration_20260816_drop_image_link_add_customer_username from './20260816_drop_image_link_add_customer_username';

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
  {
    up: migration_20260813_espansioni_item_category.up,
    down: migration_20260813_espansioni_item_category.down,
    name: '20260813_espansioni_item_category'
  },
  {
    up: migration_20260814_item_category_hierarchy.up,
    down: migration_20260814_item_category_hierarchy.down,
    name: '20260814_item_category_hierarchy'
  },
  {
    up: migration_20260814_item_category_remap.up,
    down: migration_20260814_item_category_remap.down,
    name: '20260814_item_category_remap'
  },
  {
    up: migration_20260814_categories_collection.up,
    down: migration_20260814_categories_collection.down,
    name: '20260814_categories_collection'
  },
  {
    up: migration_20260814_remove_status_preorder.up,
    down: migration_20260814_remove_status_preorder.down,
    name: '20260814_remove_status_preorder'
  },
  {
    up: migration_20260815_item_category_2_hasmany.up,
    down: migration_20260815_item_category_2_hasmany.down,
    name: '20260815_item_category_2_hasmany'
  },
  {
    up: migration_20260815_cleanup_product_attrs.up,
    down: migration_20260815_cleanup_product_attrs.down,
    name: '20260815_cleanup_product_attrs'
  },
  {
    up: migration_20260815_lot_receipt_category_kind_drop_rarity.up,
    down: migration_20260815_lot_receipt_category_kind_drop_rarity.down,
    name: '20260815_lot_receipt_category_kind_drop_rarity'
  },
  {
    up: migration_20260816_drop_image_link_add_customer_username.up,
    down: migration_20260816_drop_image_link_add_customer_username.down,
    name: '20260816_drop_image_link_add_customer_username'
  },
];
