import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CollectorListItem } from '../../types';
import { COLLECTOR_QUERY_KEYS } from './useCollectorProfile';

export function useSearchCollectors(initialQuery: string = '') {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const query = useQuery({
    queryKey: COLLECTOR_QUERY_KEYS.search(debouncedQuery),
    queryFn: async (): Promise<CollectorListItem[]> => {
      if (!debouncedQuery.trim()) return [];
      
      const { data, error } = await supabase.rpc('search_collectors', {
        p_query: debouncedQuery,
        p_limit: 20,
      });
      
      if (error) throw error;
      
      return (data as unknown as CollectorListItem[]) || [];
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  return {
    ...query,
    searchQuery,
    setSearchQuery,
    debouncedQuery,
  };
}
