export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  UPCOMING = 'UPCOMING',
}

export enum MemberGender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
}

export enum PaymentGateway {
  RAZORPAY = 'RAZORPAY',
  PHONEPE = 'PHONEPE',
  CASH = 'CASH',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum AuditLogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}
