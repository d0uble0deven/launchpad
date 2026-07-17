import { useCallback, useMemo, useState } from 'react';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import type { Node, NodeChange, NodeMouseHandler, OnNodeDrag } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Button from '../../components/atoms/Button/Button';
import TemplateTaskModal from '../../components/organisms/TemplateTaskModal/TemplateTaskModal';
import { buildDefaultTemplate } from '../../data/defaultTemplate';
import { useAppState } from '../../state/AppStateContext';
import type { Template, TemplateTask } from '../../types/board';
import LaneNode from '../BoardPage/LaneNode';
import PhaseRegionNode from '../BoardPage/PhaseRegionNode';
import TemplateTaskNode from './TemplateTaskNode';
import styles from './TemplateBuilderPage.module.css';

const nodeTypes = {
  phaseRegion: PhaseRegionNode,
  lane: LaneNode,
  templateTask: TemplateTaskNode,
};

const CANVAS_MARGIN = 60;

function TemplateBuilderPage() {
  const { state, updateTemplate } = useAppState();
  const template = state.template;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = template.tasks.find((t) => t.id === selectedId) ?? null;

  const setTemplate = useCallback(
    (updater: (prev: Template) => Template) => updateTemplate(updater),
    [updateTemplate],
  );

  const stats = useMemo(() => {
    const conditional = template.tasks.filter(
      (t) => t.conditions.length > 0,
    ).length;
    const optional = template.tasks.filter((t) => !t.required).length;
    return { total: template.tasks.length, conditional, optional };
  }, [template.tasks]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.type !== 'templateTask') return;
    const task = node.data.task as TemplateTask;
    console.log(`[template] edit "${task.title}"`);
    setSelectedId(node.id);
  }, []);

  // Restores the shipped default template. Existing hires' boards are already
  // generated, so they're unaffected — only future hires use the new template.
  const resetTemplate = useCallback(() => {
    console.log('[template] reset to default');
    setTemplate(() => buildDefaultTemplate());
    setSelectedId(null);
  }, [setTemplate]);

  const createTask = useCallback(() => {
    const phase = template.phases[0]!;
    const lane = template.swimlanes[0]!;
    const task: TemplateTask = {
      id: `tmpl-${Date.now()}`,
      title: 'New template task',
      description: '',
      ownerId: lane.id,
      category: 'intake',
      phaseId: phase.id,
      dependsOn: [],
      links: [],
      required: true,
      conditions: [],
      position: { x: phase.x + 20, y: lane.y + 24 },
    };
    console.log(`[template] created "${task.title}"`);
    setTemplate((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
    setSelectedId(task.id);
  }, [template, setTemplate]);

  const saveTask = useCallback(
    (updated: TemplateTask) => {
      console.log(`[template] saved "${updated.title}"`, updated);
      setTemplate((prev) => {
        const original = prev.tasks.find((t) => t.id === updated.id);
        let next = updated;
        // If phase/owner changed via the modal, move the card into that region.
        if (
          original &&
          (original.phaseId !== updated.phaseId ||
            original.ownerId !== updated.ownerId)
        ) {
          const phase = prev.phases.find((p) => p.id === updated.phaseId);
          const lane = prev.swimlanes.find((l) => l.id === updated.ownerId);
          next = {
            ...updated,
            position: {
              x: (phase?.x ?? updated.position.x) + 20,
              y: (lane?.y ?? updated.position.y) + 24,
            },
          };
        }
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === next.id ? next : t)),
        };
      });
    },
    [setTemplate],
  );

  const deleteTask = useCallback(
    (id: string) => {
      const target = template.tasks.find((t) => t.id === id);
      console.log(`[template] deleted "${target?.title ?? id}"`);
      setTemplate((prev) => ({
        ...prev,
        tasks: prev.tasks
          .filter((t) => t.id !== id)
          .map((t) =>
            t.dependsOn.includes(id)
              ? { ...t, dependsOn: t.dependsOn.filter((d) => d !== id) }
              : t,
          ),
      }));
      setSelectedId(null);
    },
    [template, setTemplate],
  );

  const duplicateTask = useCallback(
    (id: string) => {
      const source = template.tasks.find((t) => t.id === id);
      if (!source) return;
      const copy: TemplateTask = {
        ...structuredClone(source),
        id: `tmpl-${Date.now()}`,
        title: `${source.title} (copy)`,
        position: {
          x: source.position.x + 28,
          y: source.position.y + 28,
        },
      };
      console.log(`[template] duplicated "${source.title}"`);
      setTemplate((prev) => ({ ...prev, tasks: [...prev.tasks, copy] }));
      setSelectedId(copy.id);
    },
    [template, setTemplate],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const moves = new Map<string, { x: number; y: number }>();
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          moves.set(change.id, change.position);
        }
      }
      if (moves.size === 0) return;
      setTemplate((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          moves.has(task.id)
            ? { ...task, position: moves.get(task.id)! }
            : task,
        ),
      }));
    },
    [setTemplate],
  );

  // Dropping a card into a different phase/lane reassigns its phase/owner.
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      if (node.type !== 'templateTask') return;
      const width = node.measured?.width ?? 210;
      const height = node.measured?.height ?? 110;
      const centerX = node.position.x + width / 2;
      const centerY = node.position.y + height / 2;
      setTemplate((prev) => {
        const task = prev.tasks.find((t) => t.id === node.id);
        if (!task) return prev;
        const phase = prev.phases.find(
          (p) => centerX >= p.x && centerX < p.x + p.width,
        );
        const lane = prev.swimlanes.find(
          (l) => centerY >= l.y && centerY < l.y + l.height,
        );
        const phaseId = phase?.id ?? task.phaseId;
        const ownerId = lane?.id ?? task.ownerId;
        if (phaseId === task.phaseId && ownerId === task.ownerId) return prev;
        console.log(
          `[template] "${task.title}" reassigned to ${phase?.label ?? phaseId} / ${lane?.label ?? ownerId}`,
        );
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === task.id ? { ...t, phaseId, ownerId } : t,
          ),
        };
      });
    },
    [setTemplate],
  );

  const nodes: Node[] = useMemo(() => {
    const lastPhase = template.phases[template.phases.length - 1]!;
    const lastLane = template.swimlanes[template.swimlanes.length - 1]!;
    const canvasWidth = lastPhase.x + lastPhase.width + CANVAS_MARGIN;
    const canvasHeight = lastLane.y + lastLane.height + CANVAS_MARGIN;

    const laneById = Object.fromEntries(
      template.swimlanes.map((lane) => [lane.id, lane]),
    );

    const phaseNodes: Node[] = template.phases.map((phase, index) => ({
      id: `phase-${phase.id}`,
      type: 'phaseRegion',
      position: { x: phase.x, y: 0 },
      data: {
        label: phase.label,
        width: phase.width,
        height: canvasHeight,
        striped: index % 2 === 1,
      },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: -2,
      style: { pointerEvents: 'none' },
    }));

    const laneNodes: Node[] = template.swimlanes.map((lane) => ({
      id: `lane-${lane.id}`,
      type: 'lane',
      position: { x: 0, y: lane.y },
      data: {
        label: lane.label,
        color: lane.color,
        width: canvasWidth,
        height: lane.height,
      },
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: -1,
      style: { pointerEvents: 'none' },
    }));

    const taskNodes: Node[] = template.tasks.map((task) => ({
      id: task.id,
      type: 'templateTask',
      position: task.position,
      data: {
        task,
        accentColor: laneById[task.ownerId]?.color ?? '#ffffff',
        ownerLabel: laneById[task.ownerId]?.label ?? task.ownerId,
        dependencyCount: task.dependsOn.length,
      },
      draggable: true,
    }));

    return [...phaseNodes, ...laneNodes, ...taskNodes];
  }, [template]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.templateName}>{template.name}</span>
          <span className={styles.stats}>
            {stats.total} tasks · {stats.conditional} conditional ·{' '}
            {stats.optional} optional
          </span>
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={resetTemplate}>
            Reset Template
          </Button>
          <Button variant="primary" size="sm" onClick={createTask}>
            + New Task
          </Button>
        </div>
      </div>
      <div className={styles.canvas}>
        <ReactFlow
          key={template.id}
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          fitView
          minZoom={0.08}
          maxZoom={1.75}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="#d5d8e0"
          />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {selected && (
        <TemplateTaskModal
          key={selected.id}
          task={selected}
          template={template}
          onClose={() => setSelectedId(null)}
          onSave={saveTask}
          onDelete={() => deleteTask(selected.id)}
          onDuplicate={() => duplicateTask(selected.id)}
        />
      )}
    </div>
  );
}

export default TemplateBuilderPage;
