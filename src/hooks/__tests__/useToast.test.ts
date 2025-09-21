import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

// Mock timers
jest.useFakeTimers();

describe('useToast Hook', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current.toasts).toEqual([]);
  });

  test('should add a toast with default values', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Test message');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Test message',
      type: 'success',
      duration: 3000
    });
    expect(result.current.toasts[0].id).toBeDefined();
  });

  test('should add a toast with custom type and duration', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Error message', 'error', 5000);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'Error message',
      type: 'error',
      duration: 5000
    });
  });

  test('should add multiple toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('First message', 'success');
      result.current.showToast('Second message', 'error');
      result.current.showToast('Third message', 'info');
    });
    
    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].message).toBe('First message');
    expect(result.current.toasts[1].message).toBe('Second message');
    expect(result.current.toasts[2].message).toBe('Third message');
  });

  test('should automatically remove toast after duration', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Test message', 'success', 1000);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(1001);
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  test('should manually remove toast by id', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Test message');
    });
    
    const toastId = result.current.toasts[0].id;
    expect(result.current.toasts).toHaveLength(1);
    
    act(() => {
      result.current.removeToast(toastId);
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  test('should not remove wrong toast when removing by id', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('First message');
      result.current.showToast('Second message');
    });
    
    expect(result.current.toasts).toHaveLength(2);
    
    act(() => {
      result.current.removeToast('wrong-id');
    });
    
    expect(result.current.toasts).toHaveLength(2);
  });

  test('should handle multiple toasts with different durations', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Short message', 'success', 1000);
      result.current.showToast('Long message', 'error', 3000);
    });
    
    expect(result.current.toasts).toHaveLength(2);
    
    // Advance time by 1001ms - first toast should be removed
    act(() => {
      jest.advanceTimersByTime(1001);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Long message');
    
    // Advance time by another 2000ms - second toast should be removed
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  test('should generate unique ids for toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('First message');
      result.current.showToast('Second message');
    });
    
    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
  });

  test('should handle toast types correctly', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Success message', 'success');
      result.current.showToast('Error message', 'error');
      result.current.showToast('Info message', 'info');
    });
    
    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[1].type).toBe('error');
    expect(result.current.toasts[2].type).toBe('info');
  });

  test('should handle empty message', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('');
  });

  test('should handle very long messages', () => {
    const { result } = renderHook(() => useToast());
    const longMessage = 'A'.repeat(1000);
    
    act(() => {
      result.current.showToast(longMessage);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe(longMessage);
  });

  test('should handle zero duration', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.showToast('Test message', 'success', 0);
    });
    
    expect(result.current.toasts).toHaveLength(1);
    
    // Zero duration should not auto-remove the toast
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.toasts).toHaveLength(1);
  });
});