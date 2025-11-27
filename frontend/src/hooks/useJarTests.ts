/**
 * Custom hook for jar test data.
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getJarTests } from "../api/client";
import { useStore } from "../store/useStore";

// Query key
const JAR_TESTS_KEY = ["jarTests"];

export function useJarTests() {
  const setJarTests = useStore((state) => state.setJarTests);

  const query = useQuery({
    queryKey: JAR_TESTS_KEY,
    queryFn: () => getJarTests(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync fetched data with store
  useEffect(() => {
    if (query.data?.items) {
      setJarTests(query.data.items);
    }
  }, [query.data, setJarTests]);

  return {
    jarTests: query.data?.items ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Get selected jar test from store
export function useSelectedJarTest() {
  const jarTests = useStore((state) => state.jarTests);
  const selectedJarTestId = useStore((state) => state.selectedJarTestId);

  if (!selectedJarTestId) return null;
  return jarTests.find((jt) => jt.id === selectedJarTestId) || null;
}
