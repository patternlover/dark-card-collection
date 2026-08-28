import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PROCUREMENT_MODULE } from "../../../modules/procurement"
import type ProcurementModuleService from "../../../modules/procurement/service"
import {
  createPurchaseLotWorkflow,
  CreatePurchaseLotWorkflowInput,
} from "../../../workflows/purchase-lot/create-purchase-lot"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: ProcurementModuleService = req.scope.resolve(PROCUREMENT_MODULE)
  const take = req.query.limit ? Number(req.query.limit) : 50
  const skip = req.query.offset ? Number(req.query.offset) : 0

  const [lots, count] = await service.listAndCountPurchaseLots(
    {},
    { relations: ["lines"], take, skip, order: { purchase_date: "DESC" } },
  )

  res.json({ lots, count })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await createPurchaseLotWorkflow(req.scope).run({
    input: req.body as CreatePurchaseLotWorkflowInput,
  })

  res.status(201).json(result)
}