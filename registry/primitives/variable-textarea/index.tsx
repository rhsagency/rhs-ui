"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconBraces, IconChevronDown, IconEye, IconEyeOff } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { Toggle } from "@rhs-ui/primitives/toggle";
import {
  DEFAULT_DELIMITERS,
  DEFAULT_LABELS,
  parseTemplate,
  tokenOf,
  unknownVariables,
  type Delimiters,
  type TemplateVariable,
  type VariableTextareaLabels,
} from "@rhs-ui/primitives/variable-textarea/tokens";
import { cn } from "@/lib/utils";

export type { Delimiters, TemplateVariable, VariableTextareaLabels } from "@rhs-ui/primitives/variable-textarea/tokens";

export interface VariableTextareaProps extends Omit<ComponentProps<"textarea">, "value" | "defaultValue" | "onChange" | "children" | "rows" | "maxLength"> {
  /** The template, when you control it. This is the raw text, with the variables as they are written. */
  value?: string;
  /** The template to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the raw template on every change, whether it was typed or a variable was inserted. */
  onValueChange?: (value: string) => void;
  /** The variables on offer: the key goes between the delimiters, the label names it in the menu, the sample is what the preview shows. */
  variables: readonly TemplateVariable[];
  /** What a variable is written between. Default `["{{", "}}"]`. */
  delimiters?: Delimiters;
  /** How many lines of text show before the field grows or scrolls. Default 5. */
  rows?: number;
  /** The most characters the raw template may hold. A variable that no longer fits is disabled in the menu, and says why. */
  maxLength?: number;
  /** Whether the preview is showing, when you control it. */
  preview?: boolean;
  /** Whether the preview is showing at the start, when you do not control it. Default false. */
  defaultPreview?: boolean;
  /** Called when the Preview toggle is pressed. */
  onPreviewChange?: (preview: boolean) => void;
  /** The field's name for a plain form submit: the raw template, also while the preview is showing. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<VariableTextareaLabels>;
}

/** Error text on the muted bar under the text: a little of the theme's ink in the red keeps it past 4.5:1 where the plain token falls just short. */
const ERROR = "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_14%)]";

/** A sentence with one piece of code in it, set in the mono face. The sentence comes from `labels`, so the word order is the translator's. */
function WithCode({ text, code }: { text: string; code: string }) {
  const at = text.indexOf(code);
  if (at === -1) return text;
  return (
    <>
      {text.slice(0, at)}
      <code className="font-mono text-[0.6875rem] font-medium">{code}</code>
      {text.slice(at + code.length)}
    </>
  );
}

/**
 * A template box for emails, texts and notifications. An "Insert variable"
 * menu lists the variables you pass with a label, the token as it is written
 * and a sample; choosing one puts the token where the caret is, in place of
 * any selection, and returns the focus to the text. The Preview toggle swaps
 * the text for the same message with every sample filled in, so you see what
 * a customer will read. A variable that is written but was not passed (a typo
 * such as `{{frist_name}}`) is flagged in words, with the nearest real one
 * offered. The field always reports the raw template, never the preview.
 * The helpers `parseTemplate` and `fillTemplate` live in
 * `variable-textarea/tokens`.
 */
export function VariableTextarea({
  value,
  defaultValue = "",
  onValueChange,
  variables,
  delimiters = DEFAULT_DELIMITERS,
  rows = 5,
  maxLength,
  preview: previewProp,
  defaultPreview = false,
  onPreviewChange,
  labels: labelOverrides,
  disabled,
  readOnly,
  className,
  onSelect,
  onFocus,
  onBlur,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: VariableTextareaProps) {
  const uid = useId();
  const footId = `${uid}-foot`;
  const labels: VariableTextareaLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [own, setOwn] = useState(defaultValue);
  const [ownPreview, setOwnPreview] = useState(defaultPreview);
  const preview = previewProp ?? ownPreview;
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState("");
  const text = value ?? own;
  const area = useRef<HTMLTextAreaElement | null>(null);
  // Where the caret was when the text lost the focus, and whether the text has had the focus at all: a menu that is opened first appends.
  const saved = useRef<[number, number]>([0, 0]);
  const touched = useRef(false);
  const chosen = useRef<TemplateVariable | null>(null);
  const pending = useRef<number | null>(null);

  // The field keeps the ref you pass and uses its own to move the focus.
  const attach = useCallback(
    (node: HTMLTextAreaElement | null) => {
      area.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  useLayoutEffect(() => {
    const caret = pending.current;
    if (caret === null) return;
    pending.current = null;
    area.current?.setSelectionRange(caret, caret);
  });

  function write(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function remember() {
    const node = area.current;
    if (node) saved.current = [node.selectionStart, node.selectionEnd];
  }

  /** The characters the token would replace, or the end of the text when the text has not had the focus yet. */
  function range(): [number, number] {
    return touched.current ? [Math.min(saved.current[0], text.length), Math.min(saved.current[1], text.length)] : [text.length, text.length];
  }

  /** How many characters over `maxLength` the text would be with the token in it. */
  function overBy(variable: TemplateVariable): number {
    if (maxLength === undefined) return 0;
    const [from, to] = range();
    return Math.max(0, text.length - (to - from) + tokenOf(variable.key, delimiters).length - maxLength);
  }

  function insert(variable: TemplateVariable) {
    const node = area.current;
    if (!node) return;
    const token = tokenOf(variable.key, delimiters);
    const [from, to] = range();
    node.focus({ preventScroll: true });
    node.setSelectionRange(from, to);
    // insertText is an edit the browser knows about, so Ctrl or Cmd+Z takes the variable out again.
    let done = false;
    try {
      done = document.execCommand("insertText", false, token);
    } catch {
      done = false;
    }
    if (!done) {
      pending.current = from + token.length;
      write(text.slice(0, from) + token + text.slice(to));
    }
    remember();
    setSaid(labels.inserted(variable.label));
  }

  const fragments = parseTemplate(text, variables, delimiters);
  const unknown = unknownVariables(fragments, variables);
  const listed = unknown.slice(0, 3);
  const height = `calc(${rows} * 1.625 * 0.875rem + 1rem)`;
  const near = maxLength !== undefined && maxLength - text.length <= Math.max(10, Math.round(maxLength * 0.1));
  const example = variables[0] ? tokenOf(variables[0].key, delimiters) : tokenOf("name", delimiters);
  const named = props.id !== undefined || ariaLabel !== undefined || labelledBy !== undefined;

  return (
    <div data-slot="variable-textarea" className={cn("w-full min-w-0", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
          "has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-[3px] has-[textarea:focus-visible]:ring-ring/40",
          disabled && "opacity-50",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-border bg-muted/40 px-2 py-1.5">
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" disabled={disabled || readOnly || preview || variables.length === 0} className="gap-1.5 data-[state=open]:bg-muted">
                <IconBraces aria-hidden="true" className="size-3.5" />
                {labels.insert}
                <IconChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-80 max-w-[calc(100vw-2rem)]"
              onCloseAutoFocus={(event) => {
                // A variable was chosen: the text gets the focus back, with the token in it. A menu that was only dismissed gives it to its button.
                const variable = chosen.current;
                chosen.current = null;
                if (!variable) return;
                event.preventDefault();
                insert(variable);
              }}
            >
              <DropdownMenuLabel>{labels.variables}</DropdownMenuLabel>
              {variables.map((variable) => {
                const over = overBy(variable);
                return (
                  <DropdownMenuItem
                    key={variable.key}
                    disabled={over > 0}
                    onSelect={() => {
                      chosen.current = variable;
                    }}
                    className="items-start gap-3 py-2"
                  >
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate font-medium text-foreground">{variable.label}</span>
                      <span className="truncate font-mono text-[0.6875rem] text-muted-foreground">{over > 0 ? labels.noRoom(over) : tokenOf(variable.key, delimiters)}</span>
                    </span>
                    <span className="max-w-32 shrink-0 truncate pt-0.5 text-xs text-muted-foreground">{variable.sample}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Toggle
            variant="outline"
            size="sm"
            pressed={preview}
            onPressedChange={(next) => {
              if (previewProp === undefined) setOwnPreview(next);
              onPreviewChange?.(next);
            }}
            disabled={disabled}
            className="gap-1.5"
          >
            {preview ? <IconEyeOff aria-hidden="true" className="size-3.5" /> : <IconEye aria-hidden="true" className="size-3.5" />}
            {labels.preview}
          </Toggle>
        </div>
        {/* The text stays mounted behind the preview: it keeps its undo history, and a form still posts it. */}
        <Textarea
          {...props}
          ref={attach}
          rows={rows}
          maxLength={maxLength}
          readOnly={readOnly}
          disabled={disabled}
          value={text}
          aria-label={named ? ariaLabel : labels.name}
          aria-labelledby={labelledBy}
          aria-invalid={unknown.length > 0 ? true : undefined}
          aria-describedby={[describedBy, footId].filter(Boolean).join(" ")}
          onChange={(event) => {
            setSaid("");
            write(event.target.value);
            remember();
          }}
          onSelect={(event) => {
            onSelect?.(event);
            remember();
          }}
          onFocus={(event) => {
            onFocus?.(event);
            touched.current = true;
          }}
          onBlur={(event) => {
            onBlur?.(event);
            remember();
          }}
          style={{ minHeight: height }}
          className={cn("max-h-[28rem] min-h-0 resize-y rounded-none border-0 bg-transparent px-3 py-2 shadow-none focus-visible:border-0 focus-visible:ring-0", preview && "hidden")}
        />
        {preview ? (
          <div role="group" aria-label={labels.preview} className="px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ minHeight: height }}>
            {text.trim() === "" ? (
              <p className="text-muted-foreground">{labels.previewEmpty}</p>
            ) : (
              fragments.map((fragment, index) =>
                fragment.type === "variable" ? (
                  <span key={index} title={fragment.label} className="-mx-0.5 rounded-sm bg-foreground/[0.08] px-0.5 py-px font-medium text-foreground">
                    {fragment.sample}
                  </span>
                ) : fragment.type === "unknown" ? (
                  <span key={index} className="text-destructive underline decoration-wavy decoration-destructive/60 underline-offset-4">
                    {fragment.text}
                    <span className="sr-only"> ({labels.notAVariable})</span>
                  </span>
                ) : (
                  <span key={index}>{fragment.text}</span>
                ),
              )
            )}
          </div>
        ) : null}
        <div id={footId} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5 border-t border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <div className="grid min-w-0 flex-1 gap-1">
            {listed.map((item) => (
              <p key={item.token} className={cn("flex items-start gap-1.5", ERROR)}>
                <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  <WithCode text={labels.unknown(item.token)} code={item.token} />
                  {item.suggestion ? (
                    <>
                      {" "}
                      <span className="text-muted-foreground">
                        <WithCode text={labels.didYouMean(tokenOf(item.suggestion, delimiters))} code={tokenOf(item.suggestion, delimiters)} />
                      </span>
                    </>
                  ) : null}
                </span>
              </p>
            ))}
            {unknown.length > listed.length ? <p className="pl-5">{labels.andMore(unknown.length - listed.length)}</p> : null}
            {unknown.length === 0 ? <p>{preview ? labels.sampleNote : <WithCode text={labels.hint(example)} code={example} />}</p> : null}
          </div>
          {maxLength !== undefined ? (
            <span aria-live={near ? "polite" : "off"} className={cn("tabular-nums", text.length > maxLength ? cn("font-medium", ERROR) : near && "text-foreground")}>
              {text.length}/{maxLength}
            </span>
          ) : null}
        </div>
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
