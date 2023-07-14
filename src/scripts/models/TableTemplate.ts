import { ReactNode } from "react"
import DegreeOfSuccessObject from "@/scripts/models/DegreeOfSuccessObject"

export default interface TableTemplate {
  name: string
  values: (string | ReactNode)[]
  isNested?: boolean
  hoverData?: (DegreeOfSuccessObject | undefined)[]
  isHighlighted?: boolean
}