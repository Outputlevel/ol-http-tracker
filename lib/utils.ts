/**
 * Utility functions for the application
 */

import { clsx, type ClassValue } from 'clsx';

/**
 * Combine class names using clsx
 * Utility function for merging tailwindcss classes
 *
 * @param inputs - Class names to combine
 * @returns Combined class name string
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
