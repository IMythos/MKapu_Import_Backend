export interface PasswordHasherPort {
  hashPassword(password: string): Promise<string>;
  comparePassword(plainText: string, hash: string): Promise<boolean>;
}
