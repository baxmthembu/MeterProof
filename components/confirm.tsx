"use client";

import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "lucide-react";

type Options = { title: string; body: string; confirmLabel: string };

/**
 * A centred replacement for window.confirm(). Render `dialog` once, then `await confirm({...})`.
 * Uses a native <dialog>: focus is trapped, Escape cancels, and Cancel has focus first.
 */
export function useConfirm() {
  const ref = useRef<HTMLDialogElement>(null);
  const answer = useRef<(ok: boolean) => void>(null);
  const [options, setOptions] = useState<Options | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (options && d && !d.open) {
      d.returnValue = "";
      d.showModal();
    }
  }, [options]);

  const confirm = (o: Options) =>
    new Promise<boolean>((resolve) => {
      answer.current = resolve;
      setOptions(o);
    });

  const dialog = (
    <dialog
      ref={ref}
      className="stock sheet max-w-[440px]!"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      onClose={() => {
        answer.current?.(ref.current?.returnValue === "confirm");
        answer.current = null;
        setOptions(null);
      }}
    >
      {options && (
        <form method="dialog" className="grid gap-5">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
            <span className="grid size-11 place-items-center rounded-full bg-error/10 text-error" aria-hidden="true">
              <TriangleAlert size={22} />
            </span>
            <div className="grid gap-2">
              <h2 id="confirm-title">{options.title}</h2>
              <p id="confirm-body" className="text-ink-2">{options.body}</p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button value="cancel" className="btn btn--card" autoFocus>Cancel</button>
            <button value="confirm" className="btn btn--danger">{options.confirmLabel}</button>
          </div>
        </form>
      )}
    </dialog>
  );

  return { confirm, dialog };
}
