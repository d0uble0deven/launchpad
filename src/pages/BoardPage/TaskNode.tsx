import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import StatusPill from '../../components/atoms/StatusPill/StatusPill';
import CategoryTag from '../../components/molecules/CategoryTag/CategoryTag';
import TaskCard from '../../components/molecules/TaskCard/TaskCard';
import type { BoardZoomMode } from '../../logic/boardNavigation';
import type {
  TaskCard as TaskCardData,
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
    isFocused: boolean;
  },
  'task'
>;

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
    // Tile mode: no text — owner color + status treatment carry the meaning
    // (same person-color scheme as the full cards and lane chips).
    content = (
      <div
        className={[
          styles.tile,
          STATUS_TILE_CLASS[task.status],
          isCurrentStep ? styles.currentStep : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ background: data.accentColor }}
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
    <div
      className={[
        styles.taskNode,
        data.dimmed ? styles.dimmed : '',
        data.isFocused ? styles.focused : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
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
