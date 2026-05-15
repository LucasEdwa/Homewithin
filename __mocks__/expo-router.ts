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
