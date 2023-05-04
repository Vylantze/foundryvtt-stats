import Statistics from "@/scripts/models/Statistics"

export default interface Session {
  stats: Statistics[]
  date: Date
  id: string
}