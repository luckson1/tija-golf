// cellulant_checkout_encryption.d.ts
declare module '@cellulant/checkout_encryption' {
    export class Encryption {
      constructor(IVKey: string, secretKey: string, algorithm: string);
  
      encrypt(data: string): string;
      // Add any other methods you use from this class
    }
  }
  