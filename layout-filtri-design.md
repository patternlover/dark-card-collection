# Layout Filtri — Specifica Design

## Panoramica

Questo documento descrive il layout dei filtri per desktop e mobile, organizzato come una griglia con righe e colonne.

---

## Desktop

|         | **Col 1** | **Col 2** |
|---------|-----------|-----------|
| **Row 1** | *(vuoto)* | - Path da sottolineare<br>- Titolo<br>- Descrizione<br>- Searchbar |
| **Row 2** | - Filtri  | - Inizio listato prodotti |

### Dettagli Desktop

- **Row 1, Col 1**: Area vuota (spazio bianco o placeholder).
- **Row 1, Col 2**: Contiene nell'ordine:
  1. Path da sottolineare (es. breadcrumb)
  2. Titolo pagina/sezione
  3. Descrizione
  4. Searchbar
- **Row 2, Col 1**: Sidebar con i filtri.
- **Row 2, Col 2**: Listato prodotti (inizia subito sotto la searchbar).

---

## Mobile

|         | **Col 1** |
|---------|-----------|
| **Row 1** | - Path da sottolineare<br>- Titolo<br>- Descrizione |
| **Row 2** | - Searchbar |
| **Row 3** | - Dropdown filtri |
| **Row 4** | - Inizio listato prodotti |

### Dettagli Mobile

Tutto su una singola colonna, con stacking verticale:

1. **Row 1**: Path da sottolineare, titolo e descrizione.
2. **Row 2**: Searchbar (a tutta larghezza).
3. **Row 3**: Dropdown filtri (pulsante o select che apre i filtri).
4. **Row 4**: Inizio listato prodotti.

---

## Note Implementative

- **Desktop**: I filtri sono sempre visibili in sidebar (Col 1, Row 2) e devono essere piu distanziati dalla navbar.
- **Mobile**: I filtri sono nascosti in un dropdown per risparmiare spazio verticale.
- La searchbar cambia posizione:
  - Desktop: insieme a titolo/descrizione (Row 1, Col 2).
  - Mobile: riga dedicata (Row 2).
- Rimuovere sottolineatura dalla navbar