import { useLiveThreatFeed } from './useLiveThreatFeed';

export const useThreatData = () => {
  const { threats, isRefreshing, isUnavailable, error } = useLiveThreatFeed();
  
  return {
    threats,
    loading: isRefreshing,
    error: isUnavailable ? 'Feed is unavailable' : error
  };
};
