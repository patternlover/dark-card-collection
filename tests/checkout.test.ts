import { describe, expect, it } from "vitest"
import {
  EMPTY_ADDRESS,
  clearOrderSnapshot,
  isRetryableCompleteError,
  loadOrderSnapshot,
  saveOrderSnapshot,
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
