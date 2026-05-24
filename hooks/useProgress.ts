import { useSession } from "@/context/SessionContext";
import { getProgressSnapshot } from "@/services/wellness/progressStats";
import type { ProgressSnapshot } from "@/types";
import { useEffect, useState } from "react";

export function useProgress() {
  const { profile } = useSession();
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgressSnapshot(profile)
      .then((s) => {
        setSnapshot(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { snapshot, loading };
}
