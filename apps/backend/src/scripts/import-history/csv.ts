/**
 * Parser CSV minimale per gli export Google Sheet (virgole tra doppi apici,
 * nessun escape complesso). Ritorna le righe come array di celle raw.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  const pushCell = () => {
    row.push(cell)
    cell = ""
  }
  const pushRow = () => {
    // Scarta righe interamente vuote.
    if (row.some((c) => c.trim() !== "")) rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      pushCell()
    } else if (ch === "\n") {
      pushCell()
      pushRow()
    } else if (ch === "\r") {
      // ignorato (gestito da \n)
    } else {
      cell += ch
    }
  }
  pushCell()
  pushRow()

  // Alcuni export incapsulano l'intera riga tra doppi apici (con escape "" interni):
  // in quel caso la riga risulta in un'unica cella → la si riparsa.
  return rows.map((r) =>
    r.length === 1 && r[0].includes(",") ? (parseCsv(r[0])[0] ?? r) : r,
  )
}
