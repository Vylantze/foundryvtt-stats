import User from "./User"

export default interface Statistics {
  user: User

  // d20 rolls
  natural: {
    max: number // 20
    min: number // 1
    sum: number
    count: number
  }

  checks: Record<string, number>
  critSuccess: Record<string, number>
  success: Record<string, number>
  failure: Record<string, number>
  critFailure: Record<string, number>
  noResult: Record<string, number>
  natural20: Record<string, number>
  natural1: Record<string, number>
  

  // These are all totals
  messages: number
  totalChecksMade: number // d20 rolled

  attacksMade: number
  spellsCasted: number
  spellTypes: Record<string, number>
  spellLevels: Record<string, number>

  dmgDealt: number // non-d20 rolled
  healDealt: number // non-d20 rolled for heals
  dmgTaken: number
  dmgHealed: number
  positiveDealt: number
  negativeDealt: number

  rerollsMade: number
}