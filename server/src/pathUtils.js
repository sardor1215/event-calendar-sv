// Utility functions for handling file paths across different environments
import path from 'path';

/**
 * Converts absolute file paths to relative paths for nginx serving
 * @param {string} absolutePath - The absolute file path
 * @returns {string} - The relative path starting with 'uploads/'
 */
export const convertToRelativePath = (absolutePath) => {
  if (!absolutePath) return '';
  
  // Normalize path separators (Windows to Unix)
  let normalizedPath = absolutePath.replace(/\\/g, '/');
  
  // Extract the relative path from uploads directory
  const uploadsIndex = normalizedPath.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return normalizedPath.substring(uploadsIndex + 1); // Remove leading slash
  }
  
  // If no uploads directory found, assume it's already relative
  return normalizedPath.startsWith('uploads/') ? normalizedPath : `uploads/${normalizedPath}`;
};

/**
 * Converts relative paths to absolute paths for file system operations
 * @param {string} relativePath - The relative path
 * @param {string} baseDir - The base directory (defaults to process.cwd())
 * @returns {string} - The absolute path
 */
export const convertToAbsolutePath = (relativePath, baseDir = process.cwd()) => {
  if (!relativePath) return '';
  
  // If it's already absolute, return as is
  if (relativePath.startsWith('/') || /^[A-Za-z]:/.test(relativePath)) {
    return relativePath.replace(/\\/g, '/');
  }
  
  // Convert to absolute path
  return path.join(baseDir, relativePath).replace(/\\/g, '/');
};

/**
 * Gets the file URL for serving files through nginx
 * @param {string} filePath - The file path (relative or absolute)
 * @returns {string} - The URL path for the file
 */
export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  
  const relativePath = convertToRelativePath(filePath);
  return `/${relativePath}`;
};
