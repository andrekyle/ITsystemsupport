import { Icon } from "../icons";

/**
 * Premium segmented control for recording an assessment verdict.
 * Two joined segments (positive / negative) with filled active states and an
 * integrated clear affordance shown once a decision exists.
 */

export function VerdictSwitch({
  value,
  yesLabel = "Competent",
  noLabel = "Not yet",
  yesTitle,
  noTitle,
  onYes,
  onNo,
  onClear,
}: {
  /** current decision */
  value: "yes" | "no" | null;
  yesLabel?: string;
  noLabel?: string;
  yesTitle?: string;
  noTitle?: string;
  onYes: () => void;
  onNo: () => void;
  onClear?: () => void;
}) {
  return (
    <span className="verdict" role="group" aria-label="Assessment decision">
      <button
        type="button"
        className={`v-seg yes${value === "yes" ? " on" : ""}`}
        title={yesTitle ?? yesLabel}
        aria-pressed={value === "yes"}
        onClick={onYes}
      >
        <Icon name="checkCircle" size={14} />
        <span className="v-label">{yesLabel}</span>
      </button>
      <button
        type="button"
        className={`v-seg no${value === "no" ? " on" : ""}`}
        title={noTitle ?? noLabel}
        aria-pressed={value === "no"}
        onClick={onNo}
      >
        <Icon name="close" size={13} />
        <span className="v-label">{noLabel}</span>
      </button>
      {value !== null && onClear && (
        <button
          type="button"
          className="v-clear"
          title="Clear this decision"
          aria-label="Clear this decision"
          onClick={onClear}
        >
          <Icon name="close" size={11} />
        </button>
      )}
    </span>
  );
}
