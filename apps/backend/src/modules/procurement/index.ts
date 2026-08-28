import ProcurementModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

/**
 * Procurement module: purchase lots + lines with FIFO costing, effective unit
 * cost allocation and weighted average cost. The bespoke core of Dark Card
 * Collection's inventory model (see `docs/project/medusa/REPLATFORMING.md`).
 */
export const PROCUREMENT_MODULE = "procurement"

export default Module(PROCUREMENT_MODULE, {
  service: ProcurementModuleService,
})