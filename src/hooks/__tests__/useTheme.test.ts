import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';

// Mock storage utils
jest.mock('../../utils/storage', () => ({
  storageUtils: {
    getTheme: jest.fn(),
    setTheme: jest.fn()
  }
}));

const mockStorageUtils = require('../../utils/storage').storageUtils;

describe('useTheme Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.documentElement.classList
    Object.defineProperty(document, 'documentElement', {
      value: {
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      },
      writable: true
    });
  });

  test('should initialize with light theme by default', () => {
    mockStorageUtils.getTheme.mockReturnValue('light');
    
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
  });

  test('should initialize with dark theme from storage', () => {
    mockStorageUtils.getTheme.mockReturnValue('dark');
    
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
  });

  test('should toggle from light to dark theme', () => {
    mockStorageUtils.getTheme.mockReturnValue('light');
    
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.isDarkMode).toBe(false);
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.isDarkMode).toBe(true);
    expect(mockStorageUtils.setTheme).toHaveBeenCalledWith('dark');
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
  });

  test('should toggle from dark to light theme', () => {
    mockStorageUtils.getTheme.mockReturnValue('dark');
    
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.isDarkMode).toBe(true);
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.isDarkMode).toBe(false);
    expect(mockStorageUtils.setTheme).toHaveBeenCalledWith('light');
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
  });

  test('should handle missing theme in storage', () => {
    mockStorageUtils.getTheme.mockReturnValue(null);
    
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
  });

  test('should handle invalid theme in storage', () => {
    mockStorageUtils.getTheme.mockReturnValue('invalid');
    
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
  });

  test('should persist theme changes', () => {
    mockStorageUtils.getTheme.mockReturnValue('light');
    
    const { result } = renderHook(() => useTheme());
    
    // Toggle multiple times to ensure persistence
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(mockStorageUtils.setTheme).toHaveBeenCalledWith('dark');
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(mockStorageUtils.setTheme).toHaveBeenCalledWith('light');
  });
});