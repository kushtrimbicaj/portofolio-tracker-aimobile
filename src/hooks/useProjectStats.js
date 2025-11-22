import { useState, useEffect, useCallback } from 'react';
import { getProjects } from '../services/supabase';

export default function useProjectStats() {
  const [loading, setLoading] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const [mostCommonDomains, setMostCommonDomains] = useState([]);
  const [lastAddedProject, setLastAddedProject] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const projects = await getProjects();

      setTotalProjects(projects.length);

      // Compute domain frequencies
      const counts = {};
      projects.forEach((p) => {
        const url = p?.url;
        if (typeof url === 'string' && url.length) {
          try {
            const hostname = new URL(url).hostname.replace(/^www\./, '');
            counts[hostname] = (counts[hostname] || 0) + 1;
          } catch (e) {
            // ignore malformed urls
          }
        }
      });

      const domainArray = Object.keys(counts)
        .map((d) => ({ domain: d, count: counts[d] }))
        .sort((a, b) => b.count - a.count);

      setMostCommonDomains(domainArray);

      // Find most recent by created_at
      let latest = null;
      projects.forEach((p) => {
        const created = p?.created_at;
        if (created) {
          const t = Date.parse(created);
          if (!isNaN(t)) {
            if (!latest || t > latest.time) latest = { project: p, time: t };
          }
        }
      });
      setLastAddedProject(latest ? latest.project : null);
    } catch (err) {
      console.error('useProjectStats load error', err);
      setTotalProjects(0);
      setMostCommonDomains([]);
      setLastAddedProject(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, totalProjects, mostCommonDomains, lastAddedProject, refresh: load };
}
