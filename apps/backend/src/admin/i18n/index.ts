import en from "./json/en.json"
import it from "./json/it.json"

// Le stringhe custom sono in italiano in ENTRAMBE le lingue: la dashboard Medusa
// segue la lingua del browser/profilo e il core resta inglese, ma le nostre pagine
// (Lotti, Vendite, Magazzino, Guida) devono restare sempre in italiano.
export default {
  en: {
    translation: en,
  },
  it: {
    translation: it,
  },
}
