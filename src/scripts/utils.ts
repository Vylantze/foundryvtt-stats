
import dateformat from 'dateformat';
import StatCategory from '@/scripts/models/StatCategory';

function formatDate (data: string | Date | null | undefined, format: 'asDate' | 'asTime'): string {
  if (data === null || data === undefined) return '';
  const date = typeof data === 'string' ? new Date(data) : data;
  switch (format) {
    case 'asTime':
      return dateformat(date, 'yyyy-MM-dd h:MMtt')
    case 'asDate':
    default:
      return dateformat(date, 'yyyy-MM-dd')
  }
}

function getStatCategoryDisplayName (category: StatCategory): string {
  switch (category) {
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
  getStatCategoryDisplayName,
  sumAll
}