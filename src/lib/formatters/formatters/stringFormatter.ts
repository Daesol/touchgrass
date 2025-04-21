/**
 * Truncates a string to the specified length and adds an ellipsis
 */
export const truncate = (str: string, maxLength: number = 100): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
};

/**
 * Formats a name (first + last) with proper capitalization
 */
export const formatName = (firstName: string, lastName?: string): string => {
  const formattedFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  
  if (!lastName) return formattedFirst;
  
  const formattedLast = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
  return `${formattedFirst} ${formattedLast}`;
};

/**
 * Formats a phone number in a consistent way
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if not a standard format
  return phone;
}; 