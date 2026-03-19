import prisma from '@/prisma/prisma';
import type * as Prisma from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  isEmail,
  isNameValid,
  isPasswordValid,
} from '../../../utils/validation';
import jwt from 'jsonwebtoken';
import {
  ERROR,
  INCORRECT_OTP,
  PHONE_DOES_NOT_EXIST,
  RESET_PASSWORD_RESPONSE,
  SUCCESS,
  URL_EXPIRED_OR_INVALID,
  VERIFICATION_EMAIL_SENT,
} from '@/constants';
import {
  sendForgetPasswordEmail,
  sendVerificationEmail as sendVerification,
} from '@/server/services/email';
import { getPayload } from '@/server/services/token';
import { adminOnly } from '../../wrappers';
import { getRandomNumber } from '@/utils/generator';

type RegisterUserInput = Prisma.User & { password: string };
export const registerUser = async (_: unknown, args: RegisterUserInput) => {
  const password = args.password;
  const pwHash = await bcrypt.hash(password, 10);

  if (args.email) isEmail(args.email);
  isPasswordValid(args.password);
  isNameValid(args.name || '');

  const { password: _p, ...data } = args;

  return prisma.user.create({
    data: {
      ...data,
      pwHash,
    },
  });
};

type LoginUserInput = { email: string; password: string };
export const login = async (
  _: unknown,
  { email, password }: LoginUserInput
) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return {
      error: 'Incorrect email or password',
    };
  }
  if (
    parseInt(process.env.REQUIRE_EMAIL_VERIFICATION || '') &&
    !user.isEmailVerified
  ) {
    return { error: 'Email is not verified' };
  }
  if (await bcrypt.compare(password, user.pwHash || '')) {
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string);
    return {
      user,
      token,
    };
  } else {
    return {
      error: 'Incorrect email or password',
    };
  }
};

export const sendResetPasswordLink = async (
  _: unknown,
  { email }: { email: string }
) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await sendForgetPasswordEmail(email);
  }
  return { message: RESET_PASSWORD_RESPONSE };
};

type ResetPasswordArgs = { token: string; password: string };
export const resetPassword = async (
  _: unknown,
  { token, password }: ResetPasswordArgs
) => {
  const payload = getPayload({ token });
  if (payload?.data?.email) {
    isPasswordValid(password);
    const pwHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email: payload?.data?.email },
      data: { pwHash },
    });
    return { status: SUCCESS };
  } else {
    return { status: URL_EXPIRED_OR_INVALID };
  }
};

//todo: use email for user in context; or just move this mutation anywhere else
export const sendVerificationEmail = async (
  _: unknown,
  { email }: { email: string }
) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.isEmailVerified) {
    await sendVerification(email);
  }
  return { message: VERIFICATION_EMAIL_SENT };
};

export const verifyEmail = async (_: unknown, { token }: { token: string }) => {
  const { data, error } = getPayload({ token });
  if (error || !data.email) {
    return { status: ERROR, message: URL_EXPIRED_OR_INVALID };
  }
  await prisma.user.update({
    where: { email: data.email },
    data: { isEmailVerified: true },
  });
  return { status: SUCCESS };
};

type ChangeAdminStatusArgs = { userId: string; status: boolean };
export const updateAdminStatus = adminOnly(
  async (_: unknown, { userId, status }: ChangeAdminStatusArgs) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User does not exist');
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin: true },
    });
    return updatedUser;
  }
);

export const sendPhoneOtp = async (
  _: unknown,
  { phoneNo }: { phoneNo: string }
) => {
  const user = await prisma.user.findFirst({ where: { phone: phoneNo } });
  if (!user) {
    throw new Error(PHONE_DOES_NOT_EXIST);
  }
  const otp = getRandomNumber();
  await prisma.user.update({
    where: { phone: phoneNo },
    data: {
      phoneOtp: otp + '',
      phoneOtpDoC: new Date(),
    },
  });
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWWILIO_ACCOUNT_TOKEN;
  const client = require('twilio')(accountSid, authToken);
  client.messages.create({
    body: `Your one time password is ${otp}`,
    to: '+12345678901',
    //from: '+12345678901',
  });
};

type PhoneLoginArgs = { phoneNo: string; otp: string };
export const phoneOtpLogin = async (
  _: unknown,
  { phoneNo, otp }: PhoneLoginArgs
) => {
  const user = await prisma.user.findFirst({
    where: {
      phone: phoneNo,
      phoneOtp: otp,
    },
  });
  if (!user) {
    throw new Error(INCORRECT_OTP);
  }
};

export const deleteUser = adminOnly(async (_: unknown, { id }) => {
  return prisma.user.delete({ where: { id } });
});
