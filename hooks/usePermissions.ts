import { useEffect, useState } from 'react';
import { getStoredAllowedTabs } from '@/lib/permissions';

export function usePermissions() {
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredAllowedTabs().then((tabs) => {
      setAllowedTabs(tabs);
      setLoading(false);
    });
  }, []);

  const can = (tabId: string) => allowedTabs.includes(tabId);

  return { allowedTabs, loading, can };
}
