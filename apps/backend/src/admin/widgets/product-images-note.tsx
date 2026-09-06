"use client"

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useTranslation } from "react-i18next"
import { Container, Heading, Text } from "@medusajs/ui"

/**
 * Nota immagini + nasconde gli entry-point di upload rotti.
 *
 * L'upload Media dell'Admin (sezione prodotto → "Edit images", pagina
 * `media?view=edit`) richiede un file provider che non è configurato
 * (niente infra nuova per scelta): senza, fallisce con 500. Le immagini
 * vivono su Vercel Blob e si gestiscono con scripts/upload-product-images.ts
 * + attach-images.ts. Questo widget:
 *  - mostra una nota esplicativa in italiano nella scheda prodotto;
 *  - nasconde via CSS i link `media?view=edit` (menu "Edit images" della
 *    sezione Media + bottone dell'empty state). La gallery resta visibile.
 */
function ProductImagesNote() {
  const { t } = useTranslation()

  return (
    <>
      <style>{`a[href*="media?view=edit"]{display:none!important}`}</style>
      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">{t("mediaNote.title")}</Heading>
          <Text className="mt-1 text-muted-foreground">{t("mediaNote.body")}</Text>
        </div>
      </Container>
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductImagesNote
