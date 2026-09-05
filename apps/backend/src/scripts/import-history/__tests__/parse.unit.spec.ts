import {
  groupProducts,
  mapSourceType,
  parseEuro,
  parsePurchases,
  parseSales,
  parseSheetDate,
  productKeyOf,
  splitSets,
} from "../parse"
import { parseCsv } from "../csv"

describe("parseCsv", () => {
  it("riparsa le righe interamente quotate", () => {
    const rows = parseCsv('"a,1,""€ 2,00""\n')
    expect(rows).toEqual([["a", "1", "€ 2,00"]])
  })
})

describe("parseEuro", () => {
  it("legge il formato italiano", () => {
    expect(parseEuro("€ 54,90")).toBe(54.9)
    expect(parseEuro("€ 1.234,56")).toBe(1234.56)
    expect(parseEuro("-€ 5,00")).toBe(-5)
    expect(parseEuro("22,8")).toBe(22.8)
    expect(parseEuro("€ 0,00")).toBe(0)
    expect(parseEuro("")).toBe(0)
  })
})

describe("parseSheetDate", () => {
  it("converte GG/MM/AAAA in ISO", () => {
    expect(parseSheetDate("03/07/2026")).toBe("2026-07-03T00:00:00.000Z")
  })
  it("rifiuta date invalide", () => {
    expect(() => parseSheetDate("31/02/2026")).toThrow()
    expect(() => parseSheetDate("2026-07-03")).toThrow()
  })
})

describe("splitSets", () => {
  it("separa i set multipli", () => {
    expect(splitSets("POR - X, CRI - Y")).toEqual(["POR - X", "CRI - Y"])
    expect(splitSets("-")).toEqual([])
  })
})

describe("mapSourceType", () => {
  it("mappa venditori e piattaforme", () => {
    expect(mapSourceType("Amazon.it", "Site")).toBe("online")
    expect(mapSourceType("Tabaccheria Edicola Bortolato Marco", "IRL")).toBe("newsstand")
    expect(mapSourceType("Supermercato Interspar Paese", "IRL")).toBe("supermarket")
    expect(mapSourceType("Ipermercato Emisfero Mirano", "IRL")).toBe("supermarket")
    expect(mapSourceType("EMISFERO Trebaseleghe", "IRL")).toBe("shop")
    expect(mapSourceType("Grava Emanuela", "IRL")).toBe("private")
  })
})

const PURCHASES_CSV = [
  "purchase_id,date,product_name,category,language,set,condition,platform,seller_name,quantity,unitary_net_price,shipping_fee,other_fees,net_price,gross_price,unitary_gross_price,payment_method,location,receipt_link,notes",
  'PUR-0001,03/07/2026,Set Allenatore ETB,ETB,ITA,TWM - Set,SEALED,IRL,Funside Mestre,1,"€ 54,90","€ 0,00","€ 0,00","€ 54,90","€ 54,90","€ 54,90",Bank,"Via Roma 1",-,-',
  'PUR-0002,04/07/2026,Vaporeon V (SWSH 181),CARD,ITA,Spada e Scudo,EXC,IRL,Jean Marchese,1,"€ 70,00","€ 0,00","€ 0,00","€ 70,00","€ 70,00","€ 70,00",Cash,,,-',
].join("\n")

describe("parsePurchases", () => {
  it("mappa righe sealed e carte", () => {
    const { rows, errors } = parsePurchases(PURCHASES_CSV)
    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      purchase_id: "PUR-0001",
      date: "2026-07-03T00:00:00.000Z",
      categoryName: "ETB",
      productType: "product",
      language: "italian",
      condition: "new",
      sets: ["TWM - Set"],
      source_type: "shop",
      quantity: 1,
      unit_cost: 54.9,
    })
    expect(rows[1]).toMatchObject({
      categoryName: "Singole",
      productType: "card",
      condition: "exc",
    })
    expect(rows[0].notes).toContain("[PUR-0001]")
  })

  it("raggruppa per identità prodotto", () => {
    const { rows } = parsePurchases(PURCHASES_CSV)
    expect(groupProducts(rows)).toHaveLength(2)
    expect(
      productKeyOf({
        product_name: "X",
        categoryName: "ETB",
        sets: ["A"],
        language: "italian",
        condition: "new",
      }),
    ).toContain("x | etb")
  })
  it("applica le normalizzazioni note con warning", () => {
    const csv = [
      "purchase_id,date,product_name,category,language,set,condition,platform,seller_name,quantity,unitary_net_price,shipping_fee,other_fees,net_price,gross_price,unitary_gross_price,payment_method,location,receipt_link,notes",
      'PUR-0016,05/08/2026,Fascio di Busti Ascesa Eroica,Collection,ITA,ASC - X,SEALED,IRL,Emisfero,1,"€ 31,40","€ 0,00","€ 0,00","€ 31,40","€ 31,40","€ 31,40",Bank,,,-',
      'PUR-0099,07/08/2026,Collezione Serie 3,Collection,ITA,"POR - Y, CRI - Z",SEALED,IRL,Emisfero,1,"€ 21,90","€ 0,00","€ 0,00","€ 21,90","€ 21,90","€ 21,90",Bank,,,-',
    ].join("\n")
    const { rows, warnings, errors } = parsePurchases(csv)
    expect(errors).toEqual([])
    expect(rows[0].categoryName).toBe("Bundle")
    expect(rows[1].sets).toEqual([
      "CRI - Megaevoluzione - Caos Nascente",
      "PBL - Megaevoluzione - Buio Pesto",
    ])
    expect(warnings.join("\n")).toMatch("PUR-0016")
    expect(warnings.join("\n")).toMatch("PUR-0099")
  })
})

const SALES_CSV = [
  "sale_id,item_id,listing_date,sale_date,platform,unitary_gross_price,platform_fee,payment_fee,shipping_fee,gross_price,sale_price,profit,real_ROI",
  'ORD-0001,PUR-0001-01,17/07/2026,17/07/2026,Vinted,"€ 54,90","€ 0,00","€ 0,00","€ 0,00","€ 54,90","€ 58,90","€ 4,00","9,3"',
  'ORD-0002,PUR-0001-01,17/07/2026,18/07/2026,Vinted,"€ 54,90","€ 0,00","€ 0,00","€ 0,00","€ 54,90","€ 58,90","€ 4,00","9,3"',
  'ORD-0003,PUR-0002-07,10/08/2026,11/08/2026,Vinted,"€ 70,00","€ 0,00","€ 0,00","€ 0,00","€ 70,00","€ 80,00","€ 10,00","14,3"',
  'ORD-0004,PUR-0001-01,,21/08/2026,Vinted,"€ 54,90","€ 0,00","€ 0,00","€ 0,00","€ 54,90",,"-€ 54,90",enter',
  ",,,,,enter item_id,,,,\"€ 0,00\",,enter sale_price,enter sale_price",
].join("\n")

describe("parseSales", () => {
  it("raggruppa ordini, rileva doppi e salta i template", () => {
    const { rows: purchases } = parsePurchases(PURCHASES_CSV)
    const { orders, skipped, warnings, errors } = parseSales(SALES_CSV, purchases)
    // ORD-0001 ok; ORD-0002 riusa la stessa unità → errore; ORD-0003 item fixato ma qty 1 → errore range
    expect(orders.map((o) => o.sale_id)).toEqual(["ORD-0001"])
    expect(errors.join("\n")).toMatch("venduta due volte")
    expect(errors.join("\n")).toMatch("fuori range")
    expect(skipped.join("\n")).toMatch("ORD-0004")
    expect(warnings).toEqual([])
  })
})
