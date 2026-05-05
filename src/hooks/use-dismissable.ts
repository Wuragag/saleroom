import { useEffect, useRef, type RefObject } from "react";

/**
 * Dismiss-on-outside-click + dismiss-on-scroll for popovers and dropdowns.
 *
 * Pass refs to elements that should NOT trigger dismissal when clicked
 * (typically the trigger button and the popover content itself).
 *
 *   const triggerRef = useRef<HTMLButtonElement>(null);
 *   const portalRef = useRef<HTMLDivElement>(null);
 *   const [open, setOpen] = useState(false);
 *   useDismissable(open, () => setOpen(false), [triggerRef, portalRef]);
 */
export function useDismissable(
  open: boolean,
  onDismiss: () => void,
  ignoreRefs: RefObject<HTMLElement | null>[]
): void {
  // Refs are inherently stable, but the array literal isn't — read via
  // a ref-to-refs so the effect's deps stay [open, onDismiss].
  const refsRef = useRef(ignoreRefs);
  refsRef.current = ignoreRefs;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      for (const ref of refsRef.current) {
        if (ref.current?.contains(target)) return;
      }
      onDismiss();
    };

    const onScroll = () => onDismiss();

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, onDismiss]);
}
