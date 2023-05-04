import Session from "@/scripts/models/Session"
import Statistics from "@/scripts/models/Statistics"

export default interface CompiledStats {
  total: Statistics
  overall: Statistics[]
  lastUpdated: Date | undefined
  
  sessions: Session[]
}