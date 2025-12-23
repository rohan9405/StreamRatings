import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

interface OmdbSearchParams {
  title: string;
  year?: string;
}

export function useOmdb(params: OmdbSearchParams, enabled: boolean = false) {
  return useQuery({
    queryKey: [api.omdb.get.path, params],
    queryFn: async () => {
      // Create query params object
      const queryParams: Record<string, string> = { title: params.title };
      if (params.year) queryParams.year = params.year;
      
      const queryString = new URLSearchParams(queryParams).toString();
      const url = `${api.omdb.get.path}?${queryString}`;

      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 401) {
        throw new Error("Unauthorized: Check your Secrets configuration");
      }
      if (res.status === 429) {
        throw new Error("Rate limit exceeded");
      }
      if (!res.ok) {
        throw new Error("Failed to fetch movie data");
      }
      
      const data = await res.json();
      return api.omdb.get.responses[200].parse(data);
    },
    enabled: enabled && params.title.length > 0,
    retry: false,
  });
}
