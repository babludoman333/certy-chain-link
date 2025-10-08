/**
 * Security-hardened error handler
 * Maps internal errors to safe user-facing messages
 */

export const getSecureErrorMessage = (error: any): string => {
  // Never expose internal error details to users
  // All errors return generic messages
  
  if (!error) return "An error occurred";
  
  const errorMessage = error?.message?.toLowerCase() || "";
  
  // Authentication errors
  if (errorMessage.includes("invalid login") || 
      errorMessage.includes("invalid credentials") ||
      errorMessage.includes("email not confirmed")) {
    return "Invalid credentials";
  }
  
  if (errorMessage.includes("user already registered") ||
      errorMessage.includes("already exists")) {
    return "An account with this email already exists";
  }
  
  // Access control errors
  if (errorMessage.includes("permission") || 
      errorMessage.includes("rls") ||
      errorMessage.includes("policy")) {
    return "Access denied";
  }
  
  // Not found errors (generic to prevent user enumeration)
  if (errorMessage.includes("not found") ||
      errorMessage.includes("no rows")) {
    return "Record not found";
  }
  
  // Network errors
  if (errorMessage.includes("fetch") || 
      errorMessage.includes("network")) {
    return "Connection error. Please try again";
  }
  
  // Default generic error
  return "An error occurred. Please try again";
};

/**
 * Log errors securely (server-side only in production)
 */
export const logError = (error: any, context?: string) => {
  // Only log in development
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Error'}]:`, error);
  }
  // In production, send to proper error monitoring service
  // DO NOT log to console in production
};
