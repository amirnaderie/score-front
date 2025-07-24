export interface userType {
  id: string;
  userName: string | null;
  roleId: number;
  personelCode: string;
  unitCode: string;
  unitName: string;
  position: string;
  fullName: string;
  mobileNumber: string;
  nationalCode: string;
  imageId?: string | null;
  isAdmin?: boolean,
  roles? : string[]
}


export interface zarrirUserType {
  id?: string;
  username?: string;
  isActive?: true;
  title?: string;
  phoneNumber?: string;
  passwordChangedAt?: { seconds: number; nanos: number };
  lastLoginDate?: { seconds: number; nanos: number };
  nationalCode?: string;
  roles?: [string];
  roleDescription?: { [key: string]: string };
  additionalClaims?: { organizationId: string };
  lockedUntil?: { seconds: number; nanos: number };
  sub?: string;
}