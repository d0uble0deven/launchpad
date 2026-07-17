import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
} from '@xyflow/react';
import type {
  Node,
  NodeChange,
  NodeMouseHandler,
  OnNodeDrag,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Button from '../../components/atoms/Button/Button';
import Select from '../../components/atoms/Select/Select';
import TaskModal from '../../components/organisms/TaskModal/TaskModal';
import {
  getInitialViewportTarget,
  phaseCenter,
  PHASE_ZOOM,
  READABLE_ZOOM,
  taskCenter,
} from '../../logic/boardNavigation';
import type { ViewportTarget } from '../../logic/boardNavigation';
import {
  getCurrentBlocker,
  getNextActionableTask,
  summarizeBoard,
} from '../../logic/progress';
import { useAppState } from '../../state/AppStateContext';
import type {
  OnboardingBoard,
  TaskCard as TaskCardData,
  TaskCategory,
  TaskStatus,
} from '../../types/board';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../types/board';
import LaneNode from './LaneNode';
import PhaseRegionNode from './PhaseRegionNode';
import TaskNode from './TaskNode';
import styles from './BoardPage.module.css';

const nodeTypes = {
  phaseRegion: PhaseRegionNode,
  lane: LaneNode,
  task: TaskNode,
};

const CANVAS_MARGIN = 60;

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...(Object.entries(STATUS_LABELS) as Array<[TaskStatus, string]>).map(
    ([value, label]) => ({ value, label }),
  ),
];

const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'All categories' },
  ...(Object.entries(CATEGORY_LABELS) as Array<[TaskCategory, string]>).map(
    ([value, label]) => ({ value, label }),
  ),
];

function BoardPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const {
    state,
    updateBoardLocal,
    persistTask,
    createTask: apiCreateTask,
    removeTask,
    remindTask,
    resetAll,
  } = useAppState();

  const employee = state.employees.find((e) => e.id === employeeId) ?? null;
  const board =
    state.boards.find((b) => b.employeeId === employeeId) ?? null;

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>(
    'all',
  );
  const [navHint, setNavHint] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const linkedTaskId = searchParams.get('task');

  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const centeredBoardRef = useRef<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const showHint = useCallback((message: string) => {
    setNavHint(message);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setNavHint(null), 2500);
  }, []);

  const boardId = board?.id ?? null;
  // Local-only updates for drag ticks; persistence happens on drag stop.
  const setBoardLocal = useCallback(
    (updater: (prev: OnboardingBoard) => OnboardingBoard) => {
      if (boardId) updateBoardLocal(boardId, updater);
    },
    [boardId, updateBoardLocal],
  );

  useEffect(() => {
    if (!board || !employee) return;
    console.log(`[data] board loaded for ${employee.name}`, board);
    console.log(
      `[data] ${board.tasks.length} tasks across ${board.phases.length} phases and ${board.swimlanes.length} swimlanes`,
    );
    // Log once per employee; drags update state continuously.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const selectedTask =
    board?.tasks.find((task) => task.id === selectedTaskId) ?? null;

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.type !== 'task') return;
    const task = node.data.task as TaskCardData;
    console.log(`[modal] open "${task.title}"`);
    setSelectedTaskId(node.id);
  }, []);

  const closeModal = useCallback(() => setSelectedTaskId(null), []);

  // ---- Smart viewport & navigation ----

  const centerOnTarget = useCallback(
    (target: ViewportTarget, duration = 0) => {
      const instance = instanceRef.current;
      if (!instance || !board) return;
      if ('task' in target) {
        const { x, y } = taskCenter(target.task);
        void instance.setCenter(x, y, { zoom: READABLE_ZOOM, duration });
      } else {
        const { x, y } = phaseCenter(board, target.phase);
        void instance.setCenter(x, y, { zoom: PHASE_ZOOM, duration });
      }
    },
    [board],
  );

  // Fires once per board mount (ReactFlow is keyed by board id). The
  // viewport is uncontrolled, so nothing re-centers afterwards unless the
  // user clicks a navigation control.
  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      instanceRef.current = instance;
      if (!board || !employee) return;
      if (centeredBoardRef.current === board.id) return;
      centeredBoardRef.current = board.id;
      const target = getInitialViewportTarget(board, employee, linkedTaskId);
      console.log(`LaunchPad initial viewport target: ${target.reason}`);
      centerOnTarget(target);
      if (target.kind === 'linked-task') {
        setSelectedTaskId(target.task.id);
      }
    },
    [board, employee, linkedTaskId, centerOnTarget],
  );

  const goToCurrentStep = useCallback(() => {
    if (!board) return;
    const task = getNextActionableTask(board);
    if (!task) {
      console.log('LaunchPad nav: no current step — all tasks complete');
      showHint('All tasks complete 🎉');
      return;
    }
    const { x, y } = taskCenter(task);
    void instanceRef.current?.setCenter(x, y, {
      zoom: READABLE_ZOOM,
      duration: 300,
    });
    console.log(`Centered on current step — "${task.title}"`);
  }, [board, showHint]);

  const goToBlocker = useCallback(() => {
    if (!board || !employee) return;
    const blocker = getCurrentBlocker(board, employee);
    if (!blocker) {
      console.log('LaunchPad nav: no current blocker');
      showHint('No current blocker');
      return;
    }
    const { x, y } = taskCenter(blocker);
    void instanceRef.current?.setCenter(x, y, {
      zoom: READABLE_ZOOM,
      duration: 300,
    });
    console.log(`Centered on blocker — "${blocker.title}"`);
  }, [board, employee, showHint]);

  const fitBoard = useCallback(() => {
    void instanceRef.current?.fitView({ padding: 0.1, duration: 300 });
    console.log('Fit full board');
  }, []);

  const resetSmartView = useCallback(() => {
    if (!board || !employee) return;
    const target = getInitialViewportTarget(board, employee, linkedTaskId);
    centerOnTarget(target, 300);
    console.log(`Reset to smart view — ${target.reason}`);
  }, [board, employee, linkedTaskId, centerOnTarget]);

  const jumpToPhase = useCallback(
    (phaseId: string) => {
      const phase = board?.phases.find((p) => p.id === phaseId);
      if (!board || !phase) return;
      const { x, y } = phaseCenter(board, phase);
      void instanceRef.current?.setCenter(x, y, {
        zoom: PHASE_ZOOM,
        duration: 300,
      });
      console.log(`Centered on phase "${phase.label}"`);
    },
    [board],
  );

  const createTask = useCallback(() => {
    if (!board) return;
    const phase = board.phases[0]!;
    const lane = board.swimlanes[0]!;
    const task: TaskCardData = {
      id: `t-${Date.now()}`,
      title: 'New task',
      description: '',
      ownerId: lane.id,
      status: 'not-started',
      category: 'intake',
      phaseId: phase.id,
      dependsOn: [],
      links: [],
      notes: '',
      activity: [
        {
          id: `t-${Date.now()}-a1`,
          timestamp: new Date().toISOString(),
          message: 'Card created',
        },
      ],
      position: { x: phase.x + 20, y: lane.y + 24 },
    };
    console.log(
      `[card] created "${task.title}" in ${phase.label} / ${lane.label}`,
    );
    void apiCreateTask(board.id, task);
    setSelectedTaskId(task.id);
  }, [board, apiCreateTask]);

  const deleteTask = useCallback(
    (id: string) => {
      const target = board?.tasks.find((task) => task.id === id);
      if (!target || !boardId) return;
      console.log(`[card] deleted "${target.title}"`);
      void removeTask(boardId, id);
      setSelectedTaskId(null);
    },
    [board, boardId, removeTask],
  );

  const duplicateTask = useCallback(
    (id: string) => {
      const source = board?.tasks.find((task) => task.id === id);
      if (!source) return;
      const copy: TaskCardData = {
        ...structuredClone(source),
        id: `t-${Date.now()}`,
        title: `${source.title} (copy)`,
        position: {
          x: source.position.x + 28,
          y: source.position.y + 28,
        },
        activity: [
          {
            id: `t-${Date.now()}-a1`,
            timestamp: new Date().toISOString(),
            message: `Duplicated from "${source.title}"`,
          },
        ],
      };
      console.log(`[card] duplicated "${source.title}" → "${copy.title}"`);
      void apiCreateTask(board!.id, copy);
      setSelectedTaskId(copy.id);
    },
    [board, apiCreateTask],
  );

  const saveTask = useCallback(
    (updated: TaskCardData) => {
      if (boardId) void persistTask(boardId, updated);
    },
    [boardId, persistTask],
  );

  // Drag ticks update local state only, so cards follow the cursor without
  // hammering the API; the final position is persisted on drag stop.
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const moves = new Map<string, { x: number; y: number }>();
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          moves.set(change.id, change.position);
        }
      }
      if (moves.size === 0) return;
      setBoardLocal((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          moves.has(task.id)
            ? { ...task, position: moves.get(task.id)! }
            : task,
        ),
      }));
    },
    [setBoardLocal],
  );

  const logDrag = (phase: 'start' | 'end', node: Node) => {
    if (node.type !== 'task') return;
    const task = node.data.task as TaskCardData;
    console.log(
      `[drag] ${phase} "${task.title}" at (${Math.round(node.position.x)}, ${Math.round(node.position.y)})`,
    );
  };

  const onNodeDragStart: OnNodeDrag = useCallback((_event, node) => {
    logDrag('start', node);
  }, []);

  // Dropping a card into a different phase region or swimlane reassigns its
  // phase/owner data; the final position (and any reassignment) is persisted
  // to the server in one PATCH.
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      logDrag('end', node);
      if (node.type !== 'task' || !board || !boardId) return;
      const task = board.tasks.find((t) => t.id === node.id);
      if (!task) return;

      const width = node.measured?.width ?? 210;
      const height = node.measured?.height ?? 110;
      const centerX = node.position.x + width / 2;
      const centerY = node.position.y + height / 2;
      const phase = board.phases.find(
        (p) => centerX >= p.x && centerX < p.x + p.width,
      );
      const lane = board.swimlanes.find(
        (l) => centerY >= l.y && centerY < l.y + l.height,
      );
      const phaseId = phase?.id ?? task.phaseId;
      const ownerId = lane?.id ?? task.ownerId;
      const reassigned =
        phaseId !== task.phaseId || ownerId !== task.ownerId;

      let updated: TaskCardData = { ...task, position: { ...node.position } };
      if (reassigned) {
        const phaseLabel =
          board.phases.find((p) => p.id === phaseId)?.label ?? phaseId;
        const laneLabel =
          board.swimlanes.find((l) => l.id === ownerId)?.label ?? ownerId;
        console.log(
          `[drag] "${task.title}" reassigned to ${phaseLabel} / ${laneLabel}`,
        );
        updated = {
          ...updated,
          phaseId,
          ownerId,
          activity: [
            ...updated.activity,
            {
              id: `${task.id}-a${Date.now()}`,
              timestamp: new Date().toISOString(),
              message: `Moved to ${phaseLabel} / ${laneLabel}`,
            },
          ],
        };
      }
      void persistTask(boardId, updated);
    },
    [board, boardId, persistTask],
  );

  const nodes: Node[] = useMemo(() => {
    if (!board) return [];
    const lastPhase = board.phases[board.phases.length - 1]!;
    const lastLane = board.swimlanes[board.swimlanes.length - 1]!;
    const canvasWidth = lastPhase.x + lastPhase.width + CANVAS_MARGIN;
    const canvasHeight = lastLane.y + lastLane.height + CANVAS_MARGIN;

    const laneById = Object.fromEntries(
      board.swimlanes.map((lane) => [lane.id, lane]),
    );
    const phaseById = Object.fromEntries(
      board.phases.map((phase) => [phase.id, phase]),
    );

    const phaseNodes: Node[] = board.phases.map((phase, index) => ({
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

    const laneNodes: Node[] = board.swimlanes.map((lane) => ({
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

    const taskNodes: Node[] = board.tasks.map((task) => ({
      id: task.id,
      type: 'task',
      position: task.position,
      data: {
        task,
        accentColor: laneById[task.ownerId]?.color ?? '#ffffff',
        ownerLabel: laneById[task.ownerId]?.label ?? task.ownerId,
        phaseLabel: phaseById[task.phaseId]?.label ?? '',
        dimmed:
          (statusFilter !== 'all' && task.status !== statusFilter) ||
          (categoryFilter !== 'all' && task.category !== categoryFilter),
      },
      draggable: true,
    }));

    return [...phaseNodes, ...laneNodes, ...taskNodes];
  }, [board, statusFilter, categoryFilter]);

  if (!employee || !board) {
    return (
      <div className={styles.notFound}>
        <p>No onboarding board found for this employee.</p>
        <Link to="/">← Back to dashboard</Link>
      </div>
    );
  }

  const summary = summarizeBoard(employee, board);

  return (
    <div className={styles.boardPage}>
      <div className={styles.boardHeader}>
        <Link to="/" className={styles.backLink}>
          ← Dashboard
        </Link>
        <span className={styles.employeeName}>{employee.name}</span>
        <span className={styles.employeeMeta}>
          {employee.role} · {employee.location} · Started {employee.startDate}{' '}
          · Step {summary.currentStep} of {summary.totalCount} ·{' '}
          {summary.overallPct}% complete
        </span>
        <div className={styles.headerActions}>
          <div className={styles.filters}>
            <Select
              aria-label="Filter by status"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as TaskStatus | 'all')
              }
            />
            <Select
              aria-label="Filter by category"
              options={CATEGORY_FILTER_OPTIONS}
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as TaskCategory | 'all')
              }
            />
          </div>
          <Button variant="ghost" size="sm" onClick={resetAll}>
            Reset Data
          </Button>
          <Button variant="primary" size="sm" onClick={createTask}>
            + New Card
          </Button>
        </div>
      </div>
      <div className={styles.phaseBar} role="group" aria-label="Jump to phase">
        {board.phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            className={styles.phaseJump}
            onClick={() => jumpToPhase(phase.id)}
          >
            {phase.label}
          </button>
        ))}
      </div>
      <div className={styles.canvas}>
        <ReactFlow
          key={board.id}
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          onInit={onInit}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
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
          <Panel position="top-left" className={styles.navPanel}>
            <Button size="sm" onClick={goToCurrentStep}>
              Go to Current Step
            </Button>
            <Button size="sm" onClick={goToBlocker}>
              Go to Blocker
            </Button>
            <Button size="sm" onClick={fitBoard}>
              Fit Board
            </Button>
            <Button size="sm" variant="ghost" onClick={resetSmartView}>
              Reset View
            </Button>
            {navHint && <span className={styles.navHint}>{navHint}</span>}
          </Panel>
        </ReactFlow>
      </div>
      {selectedTask && (
        <TaskModal
          key={selectedTask.id}
          task={selectedTask}
          board={board}
          onClose={closeModal}
          onSave={saveTask}
          onDelete={() => deleteTask(selectedTask.id)}
          onDuplicate={() => duplicateTask(selectedTask.id)}
          onRemind={() => remindTask(board.id, selectedTask.id)}
        />
      )}
    </div>
  );
}

export default BoardPage;
