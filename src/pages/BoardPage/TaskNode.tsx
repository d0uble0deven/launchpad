import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import TaskCard from '../../components/molecules/TaskCard/TaskCard';
import type { TaskCard as TaskCardData } from '../../types/board';
import styles from './TaskNode.module.css';

export type TaskNodeType = Node<
  {
    task: TaskCardData;
    accentColor: string;
    ownerLabel: string;
    phaseLabel: string;
  },
  'task'
>;

function TaskNode({ data }: NodeProps<TaskNodeType>) {
  const { task } = data;
  return (
    <div className={styles.taskNode}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
        isConnectable={false}
      />
      <TaskCard
        title={task.title}
        owner={data.ownerLabel}
        status={task.status}
        category={task.category}
        phaseLabel={data.phaseLabel}
        accentColor={data.accentColor}
      />
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
