
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


export const isValidPassword = (password: string, minLength: number = 8): boolean => {
  return password.length >= minLength;
};


export const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 8) return 'weak';
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (score >= 3 && password.length >= 12) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
};


export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};


export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};


export const isValidNumber = (value: string, min?: number, max?: number): boolean => {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
};


export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
};


export const isValidLength = (value: string, min: number, max: number): boolean => {
  const length = value.length;
  return length >= min && length <= max;
};


export const isValidJson = (value: string): boolean => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};


export interface ValidationRule {
  type: 'required' | 'email' | 'password' | 'phone' | 'url' | 'number' | 'length' | 'custom';
  message?: string;
  messageEn?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  validate?: (value: any) => boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const validate = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule[]>,
  language: 'ru' | 'en' = 'ru'
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  Object.entries(rules).forEach(([field, fieldRules]) => {
    const value = data[field];
    
    for (const rule of fieldRules) {
      let isValid = true;
      let message = rule.message || '';
      let messageEn = rule.messageEn || '';
      
      switch (rule.type) {
        case 'required':
          isValid = isRequired(value);
          if (!message) message = language === 'ru' ? 'Обязательное поле' : 'Required field';
          if (!messageEn) messageEn = 'Required field';
          break;
          
        case 'email':
          if (value) {
            isValid = isValidEmail(value);
            if (!message) message = language === 'ru' ? 'Некорректный email' : 'Invalid email';
            if (!messageEn) messageEn = 'Invalid email';
          }
          break;
          
        case 'password':
          if (value) {
            isValid = isValidPassword(value, rule.minLength);
            if (!message) message = language === 'ru' 
              ? `Минимум ${rule.minLength} символов` 
              : `Minimum ${rule.minLength} characters`;
            if (!messageEn) messageEn = `Minimum ${rule.minLength} characters`;
          }
          break;
          
        case 'phone':
          if (value) {
            isValid = isValidPhone(value);
            if (!message) message = language === 'ru' ? 'Некорректный телефон' : 'Invalid phone';
            if (!messageEn) messageEn = 'Invalid phone';
          }
          break;
          
        case 'url':
          if (value) {
            isValid = isValidUrl(value);
            if (!message) message = language === 'ru' ? 'Некорректный URL' : 'Invalid URL';
            if (!messageEn) messageEn = 'Invalid URL';
          }
          break;
          
        case 'number':
          if (value) {
            isValid = isValidNumber(value, rule.min, rule.max);
            if (!message) message = language === 'ru' ? 'Некорректное число' : 'Invalid number';
            if (!messageEn) messageEn = 'Invalid number';
          }
          break;
          
        case 'length':
          if (value) {
            isValid = isValidLength(value, rule.minLength || 0, rule.maxLength || Infinity);
            if (!message) message = language === 'ru' 
              ? `Длина от ${rule.minLength} до ${rule.maxLength}` 
              : `Length between ${rule.minLength} and ${rule.maxLength}`;
            if (!messageEn) messageEn = `Length between ${rule.minLength} and ${rule.maxLength}`;
          }
          break;
          
        case 'custom':
          if (rule.validate) {
            isValid = rule.validate(value);
          }
          break;
      }
      
      if (!isValid) {
        errors.push({
          field,
          message: language === 'en' && messageEn ? messageEn : message,
        });
        break;
      }
    }
  });
  
  return errors;
};
