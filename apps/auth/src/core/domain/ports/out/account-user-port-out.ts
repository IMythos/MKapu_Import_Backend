import { RegisterDto } from '../../../application/dto/in/registerDto';
import { AccountUser } from '../../entity/account-user';

export interface AccountUserPortsOut {
  findByUsername(username: string): Promise<AccountUser | null>;
  createAccount(data: any): Promise<RegisterDto>;
  updateLastAccess(userId: string): Promise<void>;
  updatePassword(id: string, newPassword: string): Promise<void>;
  getProfileData(id: number): Promise<any>;
  getPasswordById(id: string): Promise<string | null>;
  findById(id: string): Promise<AccountUser | null>;
}
