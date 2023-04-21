import Statistics from "@/scripts/models/Statistics"

export default interface CompiledStats {
  total: Statistics
  overall: Statistics[]
  lastSession: Statistics[]
  lastUpdated: Date | undefined
}