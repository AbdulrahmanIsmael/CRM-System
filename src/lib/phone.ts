export function formatPhone(
  countryCode?: string | null,
  phoneNumber?: string | null,
  fallbackPhone?: string | null,
) {
  const code = countryCode?.trim();
  const number = phoneNumber?.trim();

  if (code && number) {
    return `${code} ${number}`;
  }

  return fallbackPhone?.trim() || "";
}
