import { useEffect, useRef, useState } from "react";

/**
 * usePolling – periodically calls async fetcher, returns { data, loading, error }.
 */
export function usePolling(fetcher, interval = 30000, deps = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const timer = useRef();

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            try {
                const result = await fetcher();
                if (mounted) {
                    setData(result);
                    setError(null);
                }
            } catch (e) {
                if (mounted) setError(e);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        run();
        timer.current = setInterval(run, interval);
        return () => {
            mounted = false;
            clearInterval(timer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, loading, error };
}
