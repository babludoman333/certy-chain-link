import { z } from "zod";

/**
 * Input validation schemas for security
 */

// Email validation with strict rules
export const emailSchema = z.string()
  .trim()
  .email("Invalid email format")
  .max(255, "Email must be less than 255 characters")
  .toLowerCase();

// Certificate hash validation (SHA-256 produces 64 hex characters)
export const certificateHashSchema = z.string()
  .trim()
  .regex(/^[a-f0-9]{64}$/i, "Invalid certificate hash format")
  .transform(s => s.toLowerCase());

// Transaction ID validation
export const transactionIdSchema = z.string()
  .trim()
  .regex(/^TXN-\d{13}-[a-f0-9]{6}$/i, "Invalid transaction ID format")
  .max(100, "Transaction ID too long");

// Certificate search input (can be hash OR txn_id)
export const certificateSearchSchema = z.string()
  .trim()
  .max(255, "Search query too long")
  .min(1, "Search query cannot be empty");

// Course name validation
export const courseNameSchema = z.string()
  .trim()
  .min(1, "Course name is required")
  .max(200, "Course name must be less than 200 characters");

// User name validation
export const userNameSchema = z.string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters");

// Password validation
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be less than 72 characters"); // bcrypt limit

/**
 * Validates and sanitizes certificate search input
 */
export const validateCertificateSearch = (input: string): { 
  isValid: boolean; 
  sanitized: string;
  error?: string;
} => {
  try {
    const sanitized = certificateSearchSchema.parse(input);
    return { isValid: true, sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        sanitized: "", 
        error: error.errors[0]?.message || "Invalid input" 
      };
    }
    return { isValid: false, sanitized: "", error: "Invalid input" };
  }
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} => {
  try {
    const sanitized = emailSchema.parse(email);
    return { isValid: true, sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        sanitized: "",
        error: error.errors[0]?.message || "Invalid email"
      };
    }
    return { isValid: false, sanitized: "", error: "Invalid email" };
  }
};
