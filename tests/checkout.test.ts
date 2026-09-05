import { describe, expect, it } from "vitest"
import {
  EMPTY_ADDRESS,
  clearOrderSnapshot,
  computeTotals,
  isRetryableCompleteError,
  loadOrderSnapshot,
  pickPaymentSession,
  saveOrderSnapshot,
  selectShippingOption,
  toOrderSummary,
  validateCheckoutForm,
  type OrderSummary,
} from "@/lib/checkout"

const ADDRESS = {
  ...EMPTY_ADDRESS,
  first_name: "Mario",
  last_name: "Rossi",
  address_1: "Via Roma 1",
  city: "Roma",
  postal_code: "00100",
}

describe("validateCheckoutForm", () => {
  it("accetta un form completo valido", () => {
    expect(validateCheckoutForm("mario@esempio.it", ADDRESS)).toEqual([])
  })

  it("segnala email non valida", () => {
    expect(validateCheckoutForm("non-email", ADDRESS)).toContain(
      "Inserisci un indirizzo email valido.",
    )
  })

  it("segnala i campi indirizzo mancanti", () => {
    const errors = validateCheckoutForm("mario@esempio.it", EMPTY_ADDRESS)
    expect(errors).toContain("Inserisci il nome.")
    expect(errors).toContain("Inserisci il cognome.")
    expect(errors).toContain("Inserisci l'indirizzo di spedizione.")
    expect(errors).toContain("Inserisci la città.")
  })

  it("richiede un CAP di 5 cifre per l'Italia", () => {
    expect(
      validateCheckoutForm("mario@esempio.it", { ...ADDRESS, postal_code: "123" }),
    ).toContain("Inserisci un CAP valido (5 cifre).")
  })
})

describe("isRetryableCompleteError", () => {
  it("ritenta quando la sessione non è ancora autorizzata", () => {
    expect(isRetryableCompleteError("Payment session not authorized")).toBe(true)
    expect(isRetryableCompleteError("payment is pending webhook")).toBe(true)
  })

  it("non ritenta su errori definitivi", () => {
    expect(isRetryableCompleteError("Indirizzo di spedizione mancante")).toBe(false)
    expect(isRetryableCompleteError("Cart not found")).toBe(false)
  })
})

describe("order snapshot", () => {
  const ORDER: OrderSummary = {
    orderId: "order_123",
    transactionId: "42",
    value: 89.99,
    email: "mario@esempio.it",
    items: [{ title: "Bundle Paldea Evolved", quantity: 1, price: 80 }],
  }

  it("salva e rilegge lo snapshot per order_id", () => {
    saveOrderSnapshot(ORDER)
    expect(loadOrderSnapshot("order_123")).toEqual(ORDER)
  })

  it("ignora lo snapshot di un altro ordine", () => {
    saveOrderSnapshot(ORDER)
    expect(loadOrderSnapshot("order_altro")).toBeNull()
  })

  it("clear rimuove lo snapshot", () => {
    saveOrderSnapshot(ORDER)
    clearOrderSnapshot()
    expect(loadOrderSnapshot("order_123")).toBeNull()
  })
})

describe("pickPaymentSession", () => {
  const sessions = [
    { id: "old", provider_id: "pp_stripe_stripe", data: { client_secret: "old_secret" } },
    { id: "new", provider_id: "pp_stripe_stripe", data: { client_secret: "new_secret" } },
  ]

  it("preferisce l'ultima sessione del provider attivo", () => {
    expect(pickPaymentSession(sessions, "pp_stripe_stripe")?.id).toBe("new")
  })

  it("prende l'ultima quando il provider non matcha", () => {
    expect(pickPaymentSession(sessions, "pp_altro")?.id).toBe("new")
  })

  it("torna undefined senza sessioni", () => {
    expect(pickPaymentSession([], "pp_stripe_stripe")).toBeUndefined()
    expect(pickPaymentSession(undefined, "pp_stripe_stripe")).toBeUndefined()
  })
})

describe("selectShippingOption", () => {
  const options = [
    { id: "std", name: "Standard", amount: 999 },
    { id: "free", name: "Gratuita", amount: 0 },
    { id: "exp", name: "Express", amount: 1499 },
  ]

  it("sceglie la gratuita sopra soglia", () => {
    expect(selectShippingOption(options, 80_00)?.id).toBe("free")
  })

  it("sceglie la standard sotto soglia", () => {
    expect(selectShippingOption(options, 7999)?.id).toBe("std")
  })

  it("rispetta la scelta esplicita", () => {
    expect(selectShippingOption(options, 80_00, "exp")?.id).toBe("exp")
  })

  it("ripiega sull'automatica se l'esplicita non esiste", () => {
    expect(selectShippingOption(options, 100, "xxx")?.id).toBe("std")
  })

  it("torna undefined senza opzioni", () => {
    expect(selectShippingOption([], 100)).toBeUndefined()
  })
})

describe("computeTotals", () => {
  it("converte i centesimi in euro", () => {
    const totals = computeTotals(8000, { id: "std", amount: 999 })
    expect(totals.subtotal).toBe(80)
    expect(totals.shipping).toBeCloseTo(9.99)
    expect(totals.total).toBeCloseTo(89.99)
  })
})

describe("toOrderSummary", () => {
  it("converte i centesimi Medusa in euro", () => {
    const summary = toOrderSummary(
      {
        id: "order_1",
        display_id: 7,
        email: "mario@esempio.it",
        total: 8999,
        items: [{ title: "Bundle", quantity: 1, unit_price: 8000 }],
      },
      "order_1",
    )
    expect(summary).toMatchObject({
      orderId: "order_1",
      transactionId: "7",
      value: 89.99,
      items: [{ title: "Bundle", quantity: 1, price: 80 }],
    })
  })

  it("usa il fallback quando l'id manca", () => {
    expect(toOrderSummary({}, "")).toBeNull()
  })
})
