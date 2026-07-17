import type { Node, NodeProps } from '@xyflow/react';
import Badge from '../../components/atoms/Badge/Badge';
import CategoryTag from '../../components/molecules/CategoryTag/CategoryTag';
import OwnerPill from '../../components/molecules/OwnerPill/OwnerPill';
import type { TemplateTask } from '../../types/board';
import styles from './TemplateTaskNode.module.css';

export type TemplateTaskNodeType = Node<
  {
    task: TemplateTask;
    accentColor: string;
    ownerLabel: string;
    dependencyCount: number;
  },
  'templateTask'
>;

function TemplateTaskNode({ data }: NodeProps<TemplateTaskNodeType>) {
  const { task } = data;
  return (
    <div
      className={styles.card}
      style={{ background: data.accentColor }}
    >
      <div className={styles.top}>
        <span className={styles.title}>{task.title}</span>
      </div>
      <div className={styles.tags}>
        <CategoryTag category={task.category} />
        {task.required ? (
          <Badge tone="neutral">Required</Badge>
        ) : (
          <Badge tone="info">Optional</Badge>
        )}
        {task.conditions.length > 0 && <Badge tone="warning">Conditional</Badge>}
      </div>
      <div className={styles.footer}>
        <OwnerPill name={data.ownerLabel} />
        <span className={styles.meta}>
          {data.dependencyCount > 0 && `${data.dependencyCount} dep`}
        </span>
      </div>
    </div>
  );
}

export default TemplateTaskNode;
