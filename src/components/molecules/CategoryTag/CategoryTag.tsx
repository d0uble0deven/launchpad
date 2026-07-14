import type { TaskCategory } from '../../../types/board';
import { CATEGORY_LABELS } from '../../../types/board';
import styles from './CategoryTag.module.css';

const CATEGORY_CLASS: Record<TaskCategory, string> = {
  intake: styles.intake,
  'hr-employment': styles.hrEmployment,
  compliance: styles.compliance,
  'account-access': styles.accountAccess,
  'project-team-setup': styles.projectTeamSetup,
  'buddy-welcome': styles.buddyWelcome,
  'new-hire-first-week': styles.newHireFirstWeek,
  'reviews-follow-up': styles.reviewsFollowUp,
  automation: styles.automation,
};

type CategoryTagProps = {
  category: TaskCategory;
};

function CategoryTag({ category }: CategoryTagProps) {
  return (
    <span className={`${styles.tag} ${CATEGORY_CLASS[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}

export default CategoryTag;
