import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsProperName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isProperName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }

          // Trim whitespace
          const trimmedValue = value.trim();
          
          // Check minimum length (at least 2 characters)
          if (trimmedValue.length < 2) {
            return false;
          }
          
          // Check maximum length (reasonable limit for names)
          if (trimmedValue.length > 50) {
            return false;
          }

          // Allow only letters, spaces, hyphens, and apostrophes
          // This covers most international names including those with accents
          const namePattern = /^[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s\-']+$/;
          if (!namePattern.test(trimmedValue)) {
            return false;
          }

          // Prevent obvious fake names or repeated characters
          const lowerValue = trimmedValue.toLowerCase();
          
          // Check for repeated single characters (like "aaa", "lll")
          if (/^(.)\1+$/.test(lowerValue)) {
            return false;
          }
          
          // Check for common fake names or inappropriate content
          const invalidNames = [
            'lol', 'test', 'fake', 'admin', 'user', 'null', 'undefined',
            'name', 'firstname', 'lastname', 'aaa', 'bbb', 'ccc', 'ddd',
            'xxx', 'yyy', 'zzz', '123', 'abc', 'qwe', 'asd', 'zxc',
            'asdf', 'qwerty', 'temp', 'sample', 'example', 'demo'
          ];
          
          if (invalidNames.includes(lowerValue)) {
            return false;
          }
          
          // Check for excessive repeated characters in sequence (like "aaa" within a name)
          if (/(.)\1{2,}/.test(lowerValue)) {
            return false;
          }
          
          // Must contain at least one letter (not just spaces/punctuation)
          if (!/[a-zA-ZÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]/.test(trimmedValue)) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid name containing only letters, spaces, hyphens, and apostrophes, and cannot be a fake or inappropriate name`;
        },
      },
    });
  };
}
