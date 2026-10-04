import bcrypt from 'bcryptjs';
import { model, Schema } from 'mongoose';

const BCRYPT_COST = 12;

const adminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const AdminUser = model('AdminUser', adminUserSchema);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function createAdminUser(email: string, password: string) {
  return AdminUser.create({ email, passwordHash: await hashPassword(password) });
}
