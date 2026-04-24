import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Category } from "@/src/types/quiz";
import { useLocale } from "@/src/i18n";
import { ActionButton } from "./ActionButton";
import { mulberry32 } from "../utils";

interface Props {
  categories: Category[];
  onAnswer: (correct: boolean, value: Record<string, number | null>) => void;
  seed?: number;
  reviewAnswer?: Record<string, number | null>;
}

const POOL_ID = "pool";

function GripIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="currentColor"
      className="text-text-muted shrink-0"
    >
      <circle cx="4" cy="2.5" r="1" />
      <circle cx="8" cy="2.5" r="1" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="8" cy="6" r="1" />
      <circle cx="4" cy="9.5" r="1" />
      <circle cx="8" cy="9.5" r="1" />
    </svg>
  );
}

function DraggableItem({
  id,
  text,
  disabled,
}: {
  id: string;
  text: string;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`w-full text-left px-3 sm:px-4 py-3 rounded-lg border bg-bg-2 border-border text-sm sm:text-base text-text-primary select-none flex items-center gap-2 touch-none ${
        isDragging ? "opacity-30" : ""
      } ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
    >
      {!disabled && <GripIcon />}
      {text}
    </div>
  );
}

function DroppableZone({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-bg-2 rounded-lg p-3 border transition-colors ${
        isOver ? "border-accent" : "border-border"
      }`}
    >
      <h4 className="text-sm font-semibold text-accent mb-2">{label}</h4>
      <div className="flex flex-col gap-2 min-h-[2.5rem]">{children}</div>
    </div>
  );
}

function PoolZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: POOL_ID });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 min-h-[2.5rem] rounded-lg p-1 transition-colors ${
        isOver ? "bg-bg-2" : ""
      }`}
    >
      {children}
    </div>
  );
}

function ResultItem({
  text,
  correct,
  notes,
}: {
  text: string;
  correct: boolean;
  notes?: string | null;
}) {
  const style = correct
    ? "bg-correct-bg text-correct"
    : "bg-incorrect-bg text-incorrect";

  return (
    <div className={`w-full text-left px-3 sm:px-4 py-3 rounded-lg ${style}`}>
      {text}
      {!correct && notes && (
        <p className="text-xs opacity-75 mt-1.5 px-2 py-1 rounded border border-black/15 bg-black/5">
          {notes}
        </p>
      )}
    </div>
  );
}

export function Categorize({
  categories,
  onAnswer,
  seed,
  reviewAnswer,
}: Props) {
  const { t } = useLocale();
  const readOnly = reviewAnswer !== undefined;

  const allItems = useMemo(() => {
    const items = categories.flatMap((cat, catIdx) =>
      cat.answers.map((a) => ({
        text: a.text,
        correctCategory: catIdx,
        notes: a.notes,
      })),
    );
    const rng = seed != null ? mulberry32(seed) : Math.random;
    return items.sort(() => rng() - 0.5);
  }, [categories, seed]);

  const [assignments, setAssignments] = useState<Record<number, number | null>>(
    () => reviewAnswer ?? Object.fromEntries(allItems.map((_, i) => [i, null])),
  );
  const [submitted, setSubmitted] = useState(readOnly);
  const [locked, setLocked] = useState(readOnly);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const unassigned = allItems
    .map((item, i) => ({ ...item, idx: i }))
    .filter((_, i) => assignments[i] === null);

  const allAssigned = Object.values(assignments).every((v) => v !== null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || locked) return;

    const itemIdx = Number(String(active.id).replace("item-", ""));
    const overId = String(over.id);

    if (overId === POOL_ID) {
      setAssignments((prev) => ({ ...prev, [itemIdx]: null }));
    } else if (overId.startsWith("cat-")) {
      const catIdx = Number(overId.replace("cat-", ""));
      setAssignments((prev) => ({ ...prev, [itemIdx]: catIdx }));
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const allCorrect = allItems.every(
      (item, i) => assignments[i] === item.correctCategory,
    );
    if (allCorrect) setLocked(true);
    onAnswer(allCorrect, { ...assignments });
  };

  const activeItemIdx = activeId ? Number(activeId.replace("item-", "")) : null;
  const activeItem = activeItemIdx !== null ? allItems[activeItemIdx] : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        {!submitted && (
          <PoolZone>
            {unassigned.map(({ idx, text }) => (
              <DraggableItem
                key={idx}
                id={`item-${idx}`}
                text={text}
                disabled={locked}
              />
            ))}
          </PoolZone>
        )}

        <div className="flex flex-col gap-3">
          {categories.map((cat, catIdx) =>
            submitted ? (
              <div
                key={catIdx}
                className="bg-bg-2 rounded-lg p-3 border border-border"
              >
                <h4 className="text-sm font-semibold text-accent mb-2">
                  {cat.text}
                </h4>
                <div className="flex flex-col gap-2 min-h-[2.5rem]">
                  {allItems
                    .map((item, i) => ({ ...item, idx: i }))
                    .filter((_, i) => assignments[i] === catIdx)
                    .map(({ idx, text, notes, correctCategory }) => (
                      <ResultItem
                        key={idx}
                        text={text}
                        correct={correctCategory === catIdx}
                        notes={notes}
                      />
                    ))}
                </div>
              </div>
            ) : (
              <DroppableZone key={catIdx} id={`cat-${catIdx}`} label={cat.text}>
                {allItems
                  .map((item, i) => ({ ...item, idx: i }))
                  .filter((_, i) => assignments[i] === catIdx)
                  .map(({ idx, text }) => (
                    <DraggableItem
                      key={idx}
                      id={`item-${idx}`}
                      text={text}
                      disabled={locked}
                    />
                  ))}
              </DroppableZone>
            ),
          )}
        </div>

        {!submitted && !locked && (
          <ActionButton onClick={handleSubmit} disabled={!allAssigned}>
            {t("submit")}
          </ActionButton>
        )}
        {submitted && !locked && (
          <ActionButton onClick={() => setSubmitted(false)}>
            {t("tryAgain")}
          </ActionButton>
        )}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="w-full text-left px-3 sm:px-4 py-3 rounded-lg border border-accent bg-bg-2 text-sm sm:text-base text-text-primary shadow-lg flex items-center gap-2">
            <GripIcon />
            {activeItem.text}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
