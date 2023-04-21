import { ReactNode } from "react"

export default interface TableTemplate {
  name: string
  values: (string | ReactNode)[]
  isNested?: boolean
  isHighlighted?: boolean
}