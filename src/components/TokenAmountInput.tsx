"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  max?: string;
  suffix?: string;
  placeholder?: string;
  className?: string;
};

export function TokenAmountInput({
  value,
  onChange,
  max,
  suffix = "cUSD",
  placeholder = "0.00",
  className = "",
}: Props) {
  const [touched, setTouched] = useState(false);
  const isValid = value === "" || /^\d*\.?\d*$/.test(value);
  return (
    <div
      className={`flex items-center gap-2 rounded border bg-carbon px-3 py-2 ${
        touched && !isValid ? "border-magenta/60" : "border-cyan/30"
      } ${className}`}
    >
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (!touched) setTouched(true);
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-base tabular-nums text-snow outline-none placeholder:text-silver/60"
      />
      <span className="font-mono text-[10px] uppercase tracking-widest text-silver">{suffix}</span>
      {max !== undefined && (
        <button
          type="button"
          onClick={() => onChange(max)}
          className="rounded border border-cyan/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan"
        >
          MAX
        </button>
      )}
    </div>
  );
}
