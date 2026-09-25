"use client";

import { useState } from "react";

export function usePrevious<T>(value: T): T {
  const [state, setState] = useState({ value, previous: value });
  if (state.value !== value) {
    setState({ value, previous: state.value });
  }
  return state.previous;
}
