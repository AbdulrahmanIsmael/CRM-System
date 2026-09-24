"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

export function DateInput(
  props: ComponentProps<typeof Input> & {
    type?: "date" | "datetime-local";
  },
) {
  const { onChange, onInput, ...rest } = props;

  const normalize = (value: string) => {
    if (!value) return value;
    const match = value.match(/^(\d{4})\d+(.*)$/);
    return match ? `${match[1]}${match[2]}` : value;
  };

  return (
    <Input
      {...rest}
      type={rest.type ?? "date"}
      max={rest.type === "datetime-local" ? "9999-12-31T23:59" : "9999-12-31"}
      onInput={(event) => {
        const input = event.currentTarget;
        const normalized = normalize(input.value);
        if (normalized !== input.value) input.value = normalized;
        onInput?.(event);
      }}
      onChange={(event) => {
        const normalized = normalize(event.currentTarget.value);
        if (normalized !== event.currentTarget.value) event.currentTarget.value = normalized;
        onChange?.(event);
      }}
    />
  );
}
