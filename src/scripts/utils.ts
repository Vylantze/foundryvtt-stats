
import dateformat from 'dateformat';
import SpellLevel from '@/scripts/models/SpellLevels';
import SpellType from '@/scripts/models/SpellType';
import StatCategory from '@/scripts/models/StatCategory';

function formatDate (data: string | Date | null | undefined, format: 'asDate' | 'asTime'): string {
  if (data === null || data === undefined) return '';
  const date = typeof data === 'string' ? new Date(data) : data;
  switch (format) {
    case 'asTime':
      return dateformat(date, 'yyyy-mm-dd h:MMtt')
    case 'asDate':
    default:
      return dateformat(date, 'yyyy-mm-dd')
  }
}

function getDisplayName (name: StatCategory | SpellLevel | SpellType): string {
  switch (name) {
    case StatCategory.AttackRoll:
      return 'Attack rolls';
    case StatCategory.FlatCheck:
      return 'Flat checks';
    case StatCategory.Initiative:
      return 'Initiative';
    case StatCategory.SavingThrow:
      return 'Saving throws';
    case StatCategory.SkillCheck:
      return 'Skill checks';
    case StatCategory.SpellAttackRoll:
      return 'Spell attack rolls';
    case StatCategory.Free:
      return 'Free';
    
    case SpellLevel.Focus:
      return 'Focus';
    case SpellLevel.Ritual:
      return 'Ritual';
    case SpellLevel.Cantrip:
      return 'Cantrip';
    case SpellLevel.Level1:
    case SpellLevel.Level2:
    case SpellLevel.Level3:
    case SpellLevel.Level4:
    case SpellLevel.Level5:
    case SpellLevel.Level6:
    case SpellLevel.Level7:
    case SpellLevel.Level8:
    case SpellLevel.Level9:
      return name.toString();
    
    case SpellType.AttackRoll:
      return "Attack roll";
    case SpellType.DC:
      return "Saving throw";
    case SpellType.Healing:
      return "Healing";
    case SpellType.Support:
      return "Support";

    default:
      return 'Uncategorized';
  }
}

function sumAll (map: Record<string, number>): number {
  return Object.values(map).reduce((sum, num) => sum + num, 0);
}

function getPercentage (value: number): string {
  return `${(100 * value).toFixed(1)}%`;
}

export {
  formatDate,
  getPercentage,
  getDisplayName,
  sumAll
}