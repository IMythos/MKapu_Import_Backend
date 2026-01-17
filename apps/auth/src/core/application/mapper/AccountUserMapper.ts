import { AccountUser } from '../../domain/entity/account-user';
import { AccountUserOrmEntity } from '../../infrastructure/entity/account-user-orm-entity';

export class AccountUserMapper {
  static toDomain(ormEntity: AccountUserOrmEntity): AccountUser {
    return AccountUser.create({
      id: ormEntity.id,
      nombreUsuario: ormEntity.username,
      contrasenia: ormEntity.password,
      email: ormEntity.email,
      rolNombre: ormEntity.roles?.[0]?.nombre || '',
    });
  }
}
