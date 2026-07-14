import type { Node, NodeProps } from '@xyflow/react';
import styles from './regions.module.css';

export type PhaseRegionNodeType = Node<
  {
    label: string;
    width: number;
    height: number;
    striped: boolean;
  },
  'phaseRegion'
>;

function PhaseRegionNode({ data }: NodeProps<PhaseRegionNodeType>) {
  return (
    <div
      className={`${styles.phaseRegion} ${data.striped ? styles.phaseRegionStriped : ''}`}
      style={{ width: data.width, height: data.height }}
    >
      <span className={styles.phaseLabel}>{data.label}</span>
    </div>
  );
}

export default PhaseRegionNode;
