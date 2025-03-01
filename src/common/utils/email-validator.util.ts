import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import 'reflect-metadata';

const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'zoho.com',
  'mail.com',
];

export class EmailValidator {
  static isBusinessEmail(email: string): boolean {
    try {
      const domain = email.split('@')[1].toLowerCase();
      return !FREE_EMAIL_DOMAINS.includes(domain);
    } catch {
      return false;
    }
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export function IsBusinessEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBusinessEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'Veuillez fournir une adresse email professionnelle. Les fournisseurs gratuits ne sont pas autorisés.',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return typeof value === 'string' && 
                 EmailValidator.isValidEmail(value) && 
                 EmailValidator.isBusinessEmail(value);
        },
      },
    });
  };
}