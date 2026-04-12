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
import { mulberry32 } from "./QuizPlayer";

interface Props {
  categories: Category[];
  onAnswer: (correct: boolean) => void;
  seed?: number;
  displayCorrect?: boolean;
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
      className={`text-sm px-3 py-2 rounded bg-bg-3 border border-border text-text-primary select-none inline-flex items-center gap-1.5 touch-none ${
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
      <div className="flex flex-wrap gap-1.5 min-h-[2.5rem]">{children}</div>
    </div>
  );
}

function ResultItem({
  text,
  correct,
  notes,
  displayCorrect = true,
}: {
  text: string;
  correct: boolean;
  notes?: string | null;
  displayCorrect?: boolean;
}) {
  const style = displayCorrect
    ? correct
      ? "bg-correct-bg text-correct"
      : "bg-incorrect-bg text-incorrect"
    : "bg-bg-3 text-text-primary";

  return (
    <div className={`text-sm px-3 py-2 rounded ${style}`}>
      {text}
      {displayCorrect && notes && <p className="text-xs opacity-75 mt-0.5">{notes}</p>}
    </div>
  );
}

export function Categorize({ categories, onAnswer, seed, displayCorrect = true }: Props) {
  const { t } = useLocale();

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

  const [assignments, setAssignments] = useState<
    Record<number, number | null>
  >(() => Object.fromEntries(allItems.map((_, i) => [i, null])));
  const [submitted, setSubmitted] = useState(false);
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
    if (!over || submitted) return;

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
    onAnswer(allCorrect);
  };

  const activeItemIdx = activeId
    ? Number(activeId.replace("item-", ""))
    : null;
  const activeItem = activeItemIdx !== null ? allItems[activeItemIdx] : null;

  const gridCols =
    categories.length >= 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : categories.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1";

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        {!submitted && (
          <DroppableZone id={POOL_ID} label={t("items")}>
            {unassigned.map(({ idx, text }) => (
              <DraggableItem
                key={idx}
                id={`item-${idx}`}
                text={text}
                disabled={submitted}
              />
            ))}
            {unassigned.length === 0 && (
              <span className="text-xs text-text-muted italic">
                {t("allItemsAssigned")}
              </span>
            )}
          </DroppableZone>
        )}

        <div className={`grid gap-3 ${gridCols}`}>
          {categories.map((cat, catIdx) =>
            submitted ? (
              <div
                key={catIdx}
                className="bg-bg-2 rounded-lg p-3 border border-border"
              >
                <h4 className="text-sm font-semibold text-accent mb-2">
                  {cat.text}
                </h4>
                <div className="flex flex-wrap gap-1.5 min-h-[2.5rem]">
                  {allItems
                    .map((item, i) => ({ ...item, idx: i }))
                    .filter((item) => item.correctCategory === catIdx)
                    .map(({ idx, text, notes }) => (
                      <ResultItem
                        key={idx}
                        text={text}
                        correct={assignments[idx] === catIdx}
                        notes={notes}
                        displayCorrect={displayCorrect}
                      />
                    ))}
                </div>
              </div>
            ) : (
              <DroppableZone
                key={catIdx}
                id={`cat-${catIdx}`}
                label={cat.text}
              >
                {allItems
                  .map((item, i) => ({ ...item, idx: i }))
                  .filter((_, i) => assignments[i] === catIdx)
                  .map(({ idx, text }) => (
                    <DraggableItem
                      key={idx}
                      id={`item-${idx}`}
                      text={text}
                      disabled={submitted}
                    />
                  ))}
              </DroppableZone>
            ),
          )}
        </div>

        {!submitted && (
          <ActionButton onClick={handleSubmit} disabled={!allAssigned}>
            {t("submit")}
          </ActionButton>
        )}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="text-sm px-3 py-2 rounded bg-bg-3 border border-accent text-text-primary shadow-lg inline-flex items-center gap-1.5">
            <GripIcon />
            {activeItem.text}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
