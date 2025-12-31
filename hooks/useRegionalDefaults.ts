import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FALLBACK_DEFAULTS, parseLocationString, RegionalDefaults } from '../constants/defaults';

interface UseRegionalDefaultsOptions {
    autoFetch?: boolean;
    debounceMs?: number;
}

interface UseRegionalDefaultsReturn {
    defaults: RegionalDefaults;
    loading: boolean;
    error: string | null;
    matchLevel: string | null;
    fetchDefaults: (location: string) => void;
    fetchDefaultsByComponents: (city: string, district?: string, neighborhood?: string) => Promise<void>;
}

export function useRegionalDefaults(
    initialLocation?: string,
    options: UseRegionalDefaultsOptions = {}
): UseRegionalDefaultsReturn {
    const { autoFetch = true, debounceMs = 500 } = options;

    const [defaults, setDefaults] = useState<RegionalDefaults>(FALLBACK_DEFAULTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchLevel, setMatchLevel] = useState<string | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchDefaultsByComponents = useCallback(async (
        city: string,
        district?: string,
        neighborhood?: string
    ) => {
        if (!city || city.length < 2) {
            setDefaults(FALLBACK_DEFAULTS);
            setMatchLevel(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase.rpc('get_regional_defaults', {
                p_city: city,
                p_district: district || null,
                p_neighborhood: neighborhood || null,
            });

            if (rpcError) {
                console.warn('Regional defaults RPC error:', rpcError.message);
                // Fall back to defaults, don't show error to user
                setDefaults(FALLBACK_DEFAULTS);
                setMatchLevel('fallback');
            } else if (data && Object.keys(data).length > 0) {
                setDefaults({
                    ...FALLBACK_DEFAULTS,
                    ...data,
                });
                setMatchLevel(data.match_level || 'unknown');
            } else {
                setDefaults(FALLBACK_DEFAULTS);
                setMatchLevel('fallback');
            }
        } catch (err) {
            console.error('Failed to fetch regional defaults:', err);
            setDefaults(FALLBACK_DEFAULTS);
            setMatchLevel('error');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDefaults = useCallback(async (location: string) => {
        const { city, district, neighborhood } = parseLocationString(location);
        await fetchDefaultsByComponents(city, district || undefined, neighborhood || undefined);
    }, [fetchDefaultsByComponents]);

    // Debounced fetch when location changes
    const debouncedFetch = useCallback((location: string) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            fetchDefaults(location);
        }, debounceMs);
    }, [debounceMs, fetchDefaults]);

    // Auto-fetch on mount if initial location provided
    useEffect(() => {
        if (autoFetch && initialLocation) {
            fetchDefaults(initialLocation);
        }

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        defaults,
        loading,
        error,
        matchLevel,
        fetchDefaults: debouncedFetch,
        fetchDefaultsByComponents,
    };
}

// Hook to get list of available cities
export function useAvailableCities() {
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const { data, error } = await supabase.rpc('get_available_cities');

                if (!error && data) {
                    setCities(data);
                }
            } catch (err) {
                console.error('Failed to fetch cities:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCities();
    }, []);

    return { cities, loading };
}
