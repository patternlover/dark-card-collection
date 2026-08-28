import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Seed iniziale per Dark Card Collection (decisione D5: fresh start, nessun import 1:1).
 * Allineato al dominio attuale:
 *  - vendita SOLO in Italia, valuta EUR;
 *  - sales channel per ogni canale di vendita (website + vendite esterne);
 *  - location "Magazzino IT" (unica);
 *  - prodotti sealed = 1 Product con 1 variant "Default" e stock su inventory level;
 *  - opzioni di spedizione standard + gratuita (regola "gratis dagli 80€" da F2).
 * Gli importi Medusa sono in centesimi (minor unit).
 */
export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  logger.info("Seeding Dark Card Collection store data...");

  const { result: salesChannels } = await createSalesChannelsWorkflow(
    container
  ).run({
    input: {
      salesChannelsData: [
        {
          name: "Website",
          description: "Canale di vendita storefront (darkcardcollection.com)",
        },
        { name: "Vinted", description: "Vendite esterne su Vinted" },
        { name: "eBay", description: "Vendite esterne su eBay" },
        { name: "Cardmarket", description: "Vendite esterne su Cardmarket" },
        { name: "Altro", description: "Vendite esterne su altri canali" },
      ],
    },
  });

  const websiteChannel = salesChannels.find((c) => c.name === "Website")!;

  logger.info("Seeding publishable API key...");
  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Storefront Publishable API Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [websiteChannel.id],
    },
  });

  logger.info("Seeding store data...");
  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Dark Card Collection",
          supported_currencies: [
            {
              currency_code: "eur",
              is_default: true,
            },
          ],
          default_sales_channel_id: websiteChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Italia",
          currency_code: "eur",
          countries: ["it"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "it",
        provider_id: "tp_system",
      },
    ],
  });

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Magazzino IT",
          address: {
            city: "Roma",
            country_code: "IT",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Magazzino IT delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Italia",
        geo_zones: [
          {
            country_code: "it",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  const shippingRuleBase = [
    {
      attribute: "enabled_in_store",
      value: "true",
      operator: "eq",
    },
    {
      attribute: "is_return",
      value: "false",
      operator: "eq",
    },
  ] satisfies { attribute: string; operator: "eq"; value: string }[];

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Spedizione in 2-3 giorni lavorativi.",
          code: "standard",
        },
        prices: [
          {
            region_id: region.id,
            amount: 999,
          },
        ],
        rules: shippingRuleBase,
      },
      {
        name: "Spedizione Gratuita",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Gratuita",
          description: "Spedizione gratuita dagli 80€ (regola condizionale da F2).",
          code: "free",
        },
        prices: [
          {
            region_id: region.id,
            amount: 0,
          },
        ],
        rules: shippingRuleBase,
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: salesChannels.map((c) => c.id),
    },
  });

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Sealed",
          is_active: true,
        },
      ],
    },
  });

  const { result: productOptionsResult } = await createProductOptionsWorkflow(
    container
  ).run({
    input: {
      product_options: [
        {
          title: "Default",
          values: ["Default"],
        },
      ],
    },
  });
  const defaultOption = productOptionsResult[0];

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Bundle Paldea Evolved",
          category_ids: [categoryResult[0].id],
          description:
            "Prodotto demo sealed: una bustina o box del set Paldea Evolved.",
          handle: "bundle-paldea-evolved",
          weight: 200,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [{ id: defaultOption.id }],
          variants: [
            {
              title: "Default",
              sku: "PALDEA-EVOLVED-BOOSTER",
              options: {
                Default: "Default",
              },
              prices: [
                {
                  amount: 12000,
                  currency_code: "eur",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: websiteChannel.id,
            },
          ],
          // Metadata allineate al tracking GA4 / Merchant (custom dimensions):
          // product_type, set_name, language, condition, grade
          metadata: {
            product_type: "sealed",
            set_name: "Paldea Evolved",
            language: "english",
            condition: "new",
          },
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 6,
        inventory_item_id: item.id,
      })),
    },
  });
  logger.info("Finished seeding inventory levels data.");

  logger.info("Seeding done.");
}