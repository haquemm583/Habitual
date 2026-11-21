import { useEffect, useState } from 'react';
import { milestonesRequest } from '../auth/api';

export function useMilestoneOptions() {
  const [options, setOptions] = useState({ milestones: [], loading: true, error: false });

  useEffect(() => {
    const controller = new AbortController();
    milestonesRequest('', { signal: controller.signal })
      .then((milestones) => {
        if (!controller.signal.aborted) setOptions({ milestones, loading: false, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setOptions({ milestones: [], loading: false, error: true });
      });
    return () => controller.abort();
  }, []);

  return options;
}
