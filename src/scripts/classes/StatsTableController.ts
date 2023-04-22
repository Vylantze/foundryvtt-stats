import { ReactNode } from "react"
import Statistics from '@/scripts/models/Statistics';
import TableTemplate from "@/scripts/models/TableTemplate";
import StatCategory from "@/scripts/models/StatCategory";
import { getPercentage, getStatCategoryDisplayName, sumAll } from "@/scripts/utils";

interface DegreeOfSuccess {
  critSuccess: number
  success: number
  failure: number
  critFailure: number
  noResult: number
  totalChecksMade: number
  totalValid: number
}

export default class StatsTableController {
  private _stats: Statistics[] = [];
  private _templates: TableTemplate[] = [];

  constructor (stats: Statistics[]) {
    this._stats = stats;
    this._templates = StatsTableController.constructTableTemplate(stats);
  }

  get stats (): Statistics[] {
    return this._stats;
  }

  get templates (): TableTemplate[] {
    return this._templates;
  }

  public static constructTableTemplate (stats: Statistics[]): TableTemplate[] {
    const categories = Object.values(StatCategory);
    const degrees: DegreeOfSuccess[] = stats.map((stat): DegreeOfSuccess => {
      const noResult = sumAll(stat.noResult);
      return {
        critSuccess: sumAll(stat.critSuccess),
        success: sumAll(stat.success),
        failure: sumAll(stat.failure),
        critFailure: sumAll(stat.critFailure),
        noResult: noResult,
        totalChecksMade: stat.totalChecksMade,
        totalValid: stat.totalChecksMade - noResult,
      };
    }) 

    const temp: (TableTemplate | TableTemplate[])[] = [
      {
        name: 'Messages',
        values: stats.map(stat => stat.messages),
        isNested: false
      },

      // Rolls subsection
      {
        name: 'Natural rolls (avg)',
        values: stats.map(stat => (stat.natural.sum / stat.natural.count).toFixed(1)),
        isNested: false
      },
      {
        name: 'Natural 20 (%)',
        values: stats.map(stat => getPercentage(stat.natural.max / stat.totalChecksMade)),
        isNested: true
      },
      {
        name: 'Natural 20',
        values: stats.map(stat => stat.natural.max),
        isNested: true
      },
      {
        name: 'Natural 1 (%)',
        values: stats.map(stat => getPercentage(stat.natural.min / stat.totalChecksMade)),
        isNested: true
      },
      {
        name: 'Natural 1',
        values: stats.map(stat => stat.natural.min),
        isNested: true
      },

      // Checks sub section
      {
        name: 'Checks made',
        values: stats.map(stat => stat.totalChecksMade),
        isNested: false
      },
      categories
        .map((category): TableTemplate => {
          return {
            name: getStatCategoryDisplayName(category),
            values: stats.map(stat => stat.checks[category.toString()]),
            isNested: true
          };
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      // Spells
      
      {
        name: 'Spells casted',
        values: stats.map(stat => stat.spellsCasted),
        isNested: false
      },

      // Damage section
      {
        name: 'Damage dealt',
        values: stats.map(stat => stat.dmgDealt),
        isNested: false
      },
      {
        name: 'Heals dealt',
        values: stats.map(stat => stat.healDealt),
        isNested: false
      },
      {
        name: 'Damage taken',
        values: stats.map(stat => stat.dmgTaken),
        isNested: false
      },
      {
        name: 'Damage healed',
        values: stats.map(stat => stat.dmgHealed),
        isNested: false
      },

      //
      // Success subsection
      //

      // crit success
      {
        name: 'Critical success',
        values: degrees.map(degree => getPercentage(degree.critSuccess / degree.totalValid)),
        isNested: false
      },
      {
        name: 'Total',
        values: degrees.map(degree => degree.critSuccess),
        isNested: true
      },
      categories
        .map(category => {
          return {
            name: getStatCategoryDisplayName(category),
            values: stats.map(stat => stat.critSuccess[category.toString()]),
            isNested: true
          }
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      // success
      {
        name: 'Success',
        values: degrees.map(degree => getPercentage(degree.success / degree.totalValid)),
        isNested: false
      },
      {
        name: 'Total',
        values: degrees.map(degree => degree.success),
        isNested: true
      },
      categories
        .map(category => {
          return {
            name: getStatCategoryDisplayName(category),
            values: stats.map(stat => stat.success[category.toString()]),
            isNested: true
          }
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      // failure
      {
        name: 'Failure',
        values: degrees.map(degree => getPercentage(degree.failure / degree.totalValid)),
        isNested: false
      },
      {
        name: 'Total',
        values: degrees.map(degree => degree.failure),
        isNested: true
      },
      categories
        .map(category => {
          return {
            name: getStatCategoryDisplayName(category),
            values: stats.map(stat => stat.failure[category.toString()]),
            isNested: true
          }
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      // crit failure
      {
        name: 'Critical failure',
        values: degrees.map(degree => getPercentage(degree.critFailure / degree.totalValid)),
        isNested: false
      },
      {
        name: 'Total',
        values: degrees.map(degree => degree.critFailure),
        isNested: true
      },
      categories
        .map(category => {
          return {
            name: getStatCategoryDisplayName(category),
            values: stats.map(stat => stat.critFailure[category.toString()]),
            isNested: true
          }
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      // no result
      {
        name: 'No result',
        values: degrees.map(degree => getPercentage(degree.noResult / degree.totalChecksMade)),
        isNested: false
      },
      {
        name: 'Total',
        values: degrees.map(degree => degree.noResult),
        isNested: true
      },
      categories
        .map(category => {
          return {
            name: getStatCategoryDisplayName(category),
            values: stats.map(stat => stat.noResult[category.toString()]),
            isNested: true
          }
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      // Misc
      {
        name: 'Rerolls made',
        values: stats.map(stat => stat.rerollsMade),
        isNested: false
      },
    ]

    // Flatten and return
    return temp.flat();
  }
}