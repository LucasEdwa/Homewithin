const store: Record<string, string> = {};

export const getItemAsync = jest.fn(async (key: string) => store[key] ?? null);
export const setItemAsync = jest.fn(async (key: string, value: string) => { store[key] = value; });
export const deleteItemAsync = jest.fn(async (key: string) => { delete store[key]; });

export function __reset() {
  Object.keys(store).forEach((k) => delete store[k]);
  // mockReset clears both call records AND custom implementations
  getItemAsync.mockReset().mockImplementation(async (key: string) => store[key] ?? null);
  setItemAsync.mockReset().mockImplementation(async (key: string, value: string) => { store[key] = value; });
  deleteItemAsync.mockReset().mockImplementation(async (key: string) => { delete store[key]; });
}
