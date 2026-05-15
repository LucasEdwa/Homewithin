import React from 'react';

export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};

export const useRouter = () => router;

export const Link = ({ children }: { children: React.ReactNode }) => children;

export function useLocalSearchParams() {
  return {};
}

// Calls the callback once after mount, mimicking screen focus
export const useFocusEffect = (callback: () => void | (() => void)) => {
  React.useEffect(() => {
    const cleanup = callback();
    return cleanup ?? undefined;
  }, []);
};
