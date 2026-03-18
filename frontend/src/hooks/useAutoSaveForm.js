import { useEffect, useRef, useState } from "react";

function areFormValuesEqual(currentValues, initialValues) {
  const currentKeys = Object.keys(currentValues);
  const initialKeys = Object.keys(initialValues);

  if (currentKeys.length !== initialKeys.length) {
    return false;
  }

  return currentKeys.every(
    (key) =>
      String(currentValues[key] ?? "") === String(initialValues[key] ?? ""),
  );
}

export default function useAutoSaveForm({
  enabled,
  values,
  initialValues,
  onSave,
  onError,
  resetKey,
  delay = 500,
}) {
  const [saving, setSaving] = useState(false);
  const isReadyRef = useRef(false);
  const onSaveRef = useRef(onSave);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    isReadyRef.current = false;
    setSaving(false);
  }, [resetKey]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (!isReadyRef.current) {
      isReadyRef.current = true;
      return undefined;
    }

    if (areFormValuesEqual(values, initialValues)) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSaving(true);
        await onSaveRef.current(values);
      } catch (error) {
        onErrorRef.current?.(error);
      } finally {
        setSaving(false);
      }
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, enabled, initialValues, values]);

  return saving;
}
