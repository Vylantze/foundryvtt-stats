import { ReactNode } from "react"
import { BreakdownTableType } from "@/components/BreakdownTableComponent"

export default interface TableTemplate {
  name: string
  values: (string | ReactNode)[]
  isNested?: boolean
  hoverData?: (BreakdownTableType | undefined)[]
  isHighlighted?: boolean
}