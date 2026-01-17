export interface UserProps {
  id?: number;
  nombreCompleto: string;
  dni: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fechaCreacion?: Date;
  activo?: boolean;
}

export class Usuario {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): Usuario {
    return new Usuario({
      ...props,
      activo: props.activo ?? true,
      fechaCreacion: props.fechaCreacion ?? new Date(),
    });
  }

  get id() {
    return this.props.id;
  }
  get nombreCompleto() {
    return this.props.nombreCompleto;
  }
  get dni() {
    return this.props.dni;
  }
  get email() {
    return this.props.email;
  }
  get telefono() {
    return this.props.telefono;
  }
  get direccion() {
    return this.props.direccion;
  }
  get fechaCreacion() {
    return this.props.fechaCreacion;
  }
  get activo() {
    return this.props.activo;
  }

  isActive(): boolean {
    return this.props.activo === true;
  }
}
