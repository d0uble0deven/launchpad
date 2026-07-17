import type { Node, NodeProps } from '@xyflow/react';
import type { BoardZoomMode } from '../../logic/boardNavigation';
import styles from './regions.module.css';

export type PhaseRegionNodeType = Node<
  {
    label: string;
    width: number;
    height: number;
    striped: boolean;
    /** When 'overview', the label counter-scales to stay screen-readable. */
    zoomMode?: BoardZoomMode;
  },
  'phaseRegion'
>;

function PhaseRegionNode({ data }: NodeProps<PhaseRegionNodeType>) {
  return (
    <div
      className={`${styles.phaseRegion} ${data.striped ? styles.phaseRegionStriped : ''}`}
      style={{ width: data.width, height: data.height }}
    >
      <span
        className={`${styles.phaseLabel} ${data.zoomMode === 'overview' ? styles.phaseLabelOverview : ''}`}
      >
        {data.label}
      </span>
    </div>
  );
}

export default PhaseRegionNode;
