"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const COUNTRY_CODES = [
  ["+20", "Egypt"], ["+966", "Saudi Arabia"], ["+971", "United Arab Emirates"], ["+974", "Qatar"], ["+965", "Kuwait"], ["+973", "Bahrain"], ["+968", "Oman"], ["+962", "Jordan"], ["+961", "Lebanon"], ["+970", "Palestine"], ["+212", "Morocco"], ["+213", "Algeria"], ["+216", "Tunisia"], ["+218", "Libya"], ["+249", "Sudan"], ["+1", "United States / Canada"], ["+44", "United Kingdom"], ["+49", "Germany"], ["+33", "France"], ["+39", "Italy"], ["+34", "Spain"], ["+31", "Netherlands"], ["+61", "Australia"], ["+81", "Japan"], ["+82", "South Korea"], ["+91", "India"], ["+92", "Pakistan"], ["+90", "Turkey"],
] as const;

export function formatPhone(code: string | null | undefined, number: string | null | undefined, legacy?: string | null) {
  if (number?.trim()) return `${code || "+20"} ${number.trim()}`;
  return legacy?.trim() || "";
}

export function splitLegacyPhone(code: string | null | undefined, number: string | null | undefined, legacy?: string | null) {
  const fallbackCode = code || "+20";
  if (number?.trim()) return { code: fallbackCode, number: number.trim() };
  const value = legacy?.trim() || "";
  const match = [...COUNTRY_CODES].sort((a, b) => b[0].length - a[0].length).find(([prefix]) => value.startsWith(prefix));
  if (!match) return { code: fallbackCode, number: value.replace(/^\+/, "") };
  return { code: match[0], number: value.slice(match[0].length).trim().replace(/^[ -]+/, "") };
}

export function PhoneField({ code, number, onCodeChange, onNumberChange, optionalLabel }: { code: string; number: string; onCodeChange: (value: string) => void; onNumberChange: (value: string) => void; optionalLabel?: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2">
      <Select value={code} items={COUNTRY_CODES.map(([value, label]) => ({ value, label: `${value} · ${label}` }))} onValueChange={(value) => onCodeChange(String(value))}>
        <SelectTrigger aria-label="Country code" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{COUNTRY_CODES.map(([value, label]) => <SelectItem key={value} value={value}>{value} · {label}</SelectItem>)}</SelectContent>
      </Select>
      <Input inputMode="tel" value={number} onChange={(event) => onNumberChange(event.target.value.replace(/[^0-9\s().-]/g, ""))} aria-label={optionalLabel || "Phone number"} />
    </div>
  );
}
