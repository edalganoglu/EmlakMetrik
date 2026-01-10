import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import {
    AdEventType,
    RewardedAd,
    RewardedAdEventType,
    TestIds,
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
    ? TestIds.REWARDED
    : Platform.select({
        ios: 'ca-app-pub-9004643134564213/8654274153',
        android: 'ca-app-pub-XXXXXXXXXXXXX/XXXXXXXXXX',
    }) || TestIds.REWARDED;

interface UseRewardedAdOptions {
    onRewardEarned?: (amount: number) => void;
    onAdClosed?: () => void;
    onError?: (error: Error) => void;
}

export const useRewardedAd = (options?: UseRewardedAdOptions) => {
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [rewardedAd, setRewardedAd] = useState<RewardedAd | null>(null);

    const loadAd = useCallback(() => {
        setLoading(true);
        setError(null);
        setLoaded(false);

        const ad = RewardedAd.createForAdRequest(adUnitId, {
            keywords: ['real estate', 'property', 'home', 'emlak', 'konut'],
        });

        const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
            setLoaded(true);
            setLoading(false);
        });

        const unsubscribeEarned = ad.addAdEventListener(
            RewardedAdEventType.EARNED_REWARD,
            (reward) => {
                const creditAmount = 2;
                options?.onRewardEarned?.(creditAmount);
            }
        );

        const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
            setLoaded(false);
            options?.onAdClosed?.();
            loadAd();
        });

        const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
            setLoading(false);
            setLoaded(false);
            setError(err as Error);
            options?.onError?.(err as Error);
        });

        setRewardedAd(ad);
        ad.load();

        return () => {
            unsubscribeLoaded();
            unsubscribeEarned();
            unsubscribeClosed();
            unsubscribeError();
        };
    }, [options]);

    useEffect(() => {
        const cleanup = loadAd();
        return cleanup;
    }, []);

    const showAd = useCallback(async () => {
        if (loaded && rewardedAd) {
            await rewardedAd.show();
            return true;
        }
        return false;
    }, [loaded, rewardedAd]);

    const reloadAd = useCallback(() => {
        loadAd();
    }, [loadAd]);

    return {
        loaded,
        loading,
        error,
        showAd,
        reloadAd,
    };
};

