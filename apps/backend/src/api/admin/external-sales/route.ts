import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  recordExternalSaleWorkflow,
  RecordExternalSaleWorkflowInput,
} from "../../../workflows/sales/record-external-sale"

/**
 * Records an external sale (Vinted/eBay/Cardmarket/other): creates a paid order
 * on the given sales channel, consumes FIFO, decrements inventory and snapshots
 * the landed cost on the order metadata (`dcc_cost_snapshots`).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await recordExternalSaleWorkflow(req.scope).run({
    input: req.body as RecordExternalSaleWorkflowInput,
  })

  res.status(201).json(result)
}