import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import StatusPill from '../../components/atoms/StatusPill/StatusPill';
import CategoryTag from '../../components/molecules/CategoryTag/CategoryTag';
import TaskCard from '../../components/molecules/TaskCard/TaskCard';
import type { BoardZoomMode } from '../../logic/boardNavigation';
import type {
  TaskCard as TaskCardData,
  TaskCategory,
  TaskStatus,
} from '../../types/board';
import { STATUS_LABELS } from '../../types/board';
import styles from './TaskNode.module.css';

export type TaskNodeType = Node<
  {
    task: TaskCardData;
    accentColor: string;
    ownerLabel: string;
    phaseLabel: string;
    dimmed: boolean;
    zoomMode: BoardZoomMode;
    isCurrentStep: boolean;
  },
  'task'
>;

const CATEGORY_TILE_CLASS: Record<TaskCategory, string> = {
  intake: styles.catIntake,
  'hr-employment': styles.catHrEmployment,
  compliance: styles.catCompliance,
  'account-access': styles.catAccountAccess,
  'project-team-setup': styles.catProjectTeamSetup,
  'buddy-welcome': styles.catBuddyWelcome,
  'new-hire-first-week': styles.catNewHireFirstWeek,
  'reviews-follow-up': styles.catReviewsFollowUp,
  automation: styles.catAutomation,
};

const STATUS_TILE_CLASS: Record<TaskStatus, string> = {
  'not-started': styles.stNotStarted,
  blocked: styles.stBlocked,
  ready: '',
  'in-progress': styles.stInProgress,
  done: styles.stDone,
  na: styles.stNa,
};

function TaskNode({ data }: NodeProps<TaskNodeType>) {
  const { task, zoomMode, isCurrentStep } = data;
  const tooltip = `${task.title} — ${STATUS_LABELS[task.status]}`;

  let content: React.ReactNode;
  if (zoomMode === 'overview') {
    // Tile mode: no text, category color + status treatment carries meaning.
    content = (
      <div
        className={[
          styles.tile,
          CATEGORY_TILE_CLASS[task.category],
          STATUS_TILE_CLASS[task.status],
          isCurrentStep ? styles.currentStep : '',
        ]
          .filter(Boolean)
          .join(' ')}
        title={tooltip}
      />
    );
  } else if (zoomMode === 'compact') {
    content = (
      <div
        className={[
          styles.compactCard,
          task.status === 'blocked' ? styles.stBlocked : '',
          isCurrentStep ? styles.currentStep : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ background: data.accentColor }}
        title={tooltip}
      >
        <span className={styles.compactTitle}>{task.title}</span>
        <div className={styles.compactMeta}>
          <StatusPill status={task.status} />
          <CategoryTag category={task.category} />
        </div>
      </div>
    );
  } else {
    content = (
      <TaskCard
        title={task.title}
        owner={data.ownerLabel}
        status={task.status}
        category={task.category}
        phaseLabel={data.phaseLabel}
        accentColor={data.accentColor}
      />
    );
  }

  return (
    <div className={`${styles.taskNode} ${data.dimmed ? styles.dimmed : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
        isConnectable={false}
      />
      {content}
      <Handle
        type="source"
        position={Position.Right}
        className={styles.handle}
        isConnectable={false}
      />
    </div>
  );
}

export default TaskNode;
