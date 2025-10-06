// Utility functions to handle date formatting and prevent hydration issues

export const formatDate = (dateValue: any): string => {
  if (!dateValue) return 'N/A';
  
  try {
    // Handle Firestore Timestamp
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString();
    }
    
    // Handle regular Date object or string
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatDateTime = (dateValue: any): string => {
  if (!dateValue) return 'N/A';
  
  try {
    // Handle Firestore Timestamp
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleString();
    }
    
    // Handle regular Date object or string
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleString();
  } catch (error) {
    console.warn('Error formatting date time:', error);
    return 'Invalid Date';
  }
};

export const isValidDate = (dateValue: any): boolean => {
  if (!dateValue) return false;
  
  try {
    // Handle Firestore Timestamp
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      return !isNaN(dateValue.toDate().getTime());
    }
    
    // Handle regular Date object or string
    const date = new Date(dateValue);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};