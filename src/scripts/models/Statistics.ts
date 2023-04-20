
export default interface Statistics {
    userName: string

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
    

    // These are all totals
    messages: number
    totalChecksMade: number // d20 rolled

    attacksMade: number
    spellsCasted: number

    dmgDealt: number // non-d20 rolled
    healDealt: number // non-d20 rolled for heals
    dmgTaken: number
    dmgHealed: number

    rerollsMade: number
}