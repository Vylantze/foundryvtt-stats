import { ReactNode } from "react"

import SpellLevel from '@/scripts/models/SpellLevels';
import SpellType from '@/scripts/models/SpellType';
import Statistics from '@/scripts/models/Statistics';
import DegreeOfSuccess from '@/scripts/models/DegreeOfSuccess';
import DegreeOfSuccessObject from '@/scripts/models/DegreeOfSuccessObject';
import TableTemplate from "@/scripts/models/TableTemplate";
import StatCategory from "@/scripts/models/StatCategory";
import { getPercentage, getDisplayName, sumAll } from "@/scripts/utils";

const categories = Object.values(StatCategory);
const spellLevels = Object.values(SpellLevel);
const spellTypes = Object.values(SpellType);
const degreeOfSuccessTypes = Object.values(DegreeOfSuccess);
const mapTypes = Array.from(Array(10).keys()).map(num => `MAP -${(num + 1)}`);

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

  public static getDegreeOfSuccessResults (stats: Statistics[], degrees: DegreeOfSuccessObject[], name: string, key: DegreeOfSuccess): TableTemplate[] {
    const extraKeys: any[] = stats
      .map(stat => Object.keys(stat[key]))
      .flat();

    return [
      {
        name: name,
        values: degrees.map(degree => getPercentage(degree[key] / degree.totalValid)),
        isNested: false
      },
      {
        name: 'Total',
        values: degrees.map(degree => degree[key]),
        isNested: true
      },
      categories
        .map(category => {
          return {
            name: getDisplayName(category),
            values: stats.map(stat => stat[key][category.toString()]),
            isNested: true
          }
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),
    ].flat();
  }

  public static constructTableTemplate (stats: Statistics[]): TableTemplate[] {
    const degrees: DegreeOfSuccessObject[] = stats.map((stat): DegreeOfSuccessObject => {
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

      // Natural 20
      {
        name: 'Natural 20',
        values: stats.map(stat => getPercentage(stat.natural.max / stat.totalChecksMade)),
        isNested: false
      },
      {
        name: 'Total',
        values: stats.map(stat => stat.natural.max),
        isNested: true
      },
      categories
        .map((category): TableTemplate => {
          return {
            name: getDisplayName(category),
            values: stats.map(stat => stat.natural20[category.toString()]),
            isNested: true
          };
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      // Natural 1
      {
        name: 'Natural 1',
        values: stats.map(stat => getPercentage(stat.natural.min / stat.totalChecksMade)),
        isNested: false
      },
      {
        name: 'Total',
        values: stats.map(stat => stat.natural.min),
        isNested: true
      },
      categories
        .map(category => {
          return {
            name: getDisplayName(category),
            values: stats.map(stat => stat.natural1[category.toString()]),
            isNested: true
          }
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      // Damage section
      {
        name: 'Damage dealt',
        values: stats.map(stat => stat.dmgDealt),
        isNested: false
      },
      {
        name: 'Positive damage dealt (non-attacks)',
        values: stats.map(stat => stat.positiveDealt),
        isNested: false
      },
      {
        name: 'Negative damage dealt (non-attacks)',
        values: stats.map(stat => stat.negativeDealt),
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


      // Spells
      
      {
        name: 'Spells casted',
        values: stats.map(stat => stat.spellsCasted),
        isNested: false
      },
      spellTypes
        .map(type => {
          return {
            name: getDisplayName(type),
            values: stats.map(stat => stat.spellTypes[type.toString()]),
            isNested: true
          }
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),
      spellLevels
        .map(type => {
          return {
            name: getDisplayName(type),
            values: stats.map(stat => stat.spellLevels[type.toString()]),
            isNested: true
          }
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      // Checks sub section
      {
        name: 'Checks made',
        values: stats.map(stat => stat.totalChecksMade),
        isNested: false
      },
      categories
        .map((category): TableTemplate => {
          return {
            name: getDisplayName(category),
            values: stats.map(stat => stat.checks[category.toString()]),
            isNested: true
          };
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      //
      // Map attacks section
      //
      {
        name: 'MAP attacks made',
        values: stats.map(stat => Object.values(stat.mapAttacks).map(obj => obj.totalChecksMade).reduce((sum, num) => sum + num, 0)),
        isNested: false
      },

      mapTypes
        .map((mapType): TableTemplate => {
          return {
            name: `${mapType} hit rate`,
            values: stats.map(stat => {
              const mapAttack = stat.mapAttacks[mapType];
              if (mapAttack === undefined) return undefined;
              if (mapAttack.totalChecksMade === 0) return undefined;
              return getPercentage((mapAttack.critSuccess + mapAttack.success) / mapAttack.totalChecksMade);
            }),
            isNested: true
          };
        })
        .filter(template => template.values.filter(value => value !== undefined).length > 0),

      //
      // Degrees of Success subsection
      //
      degreeOfSuccessTypes.map((successType) => 
        this.getDegreeOfSuccessResults(stats, degrees, getDisplayName(successType), successType)
      ).flat(),

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