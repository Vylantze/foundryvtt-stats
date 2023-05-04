import Statistics from "@/scripts/models/Statistics"

export default interface Session {
  data: Statistics[]
  date: Date
  id: string
}