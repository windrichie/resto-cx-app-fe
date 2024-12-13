import { createHmac } from 'crypto';

const SECRET_KEY = process.env.RESERVATION_SECRET_KEY as string;

export function generateReservationMAC(confirmationCode: string, email: string): string {
  const hmac = createHmac('sha256', SECRET_KEY);
  hmac.update(`${confirmationCode}:${email}`);
  return hmac.digest('hex');
}

export function verifyReservationMAC(
  confirmationCode: string,
  email: string,
  mac: string
): boolean {
  const expectedMAC = generateReservationMAC(confirmationCode, email);
  return mac === expectedMAC;
}

export function generateReservationLink(confirmationCode: string, email: string): string {
  const mac = generateReservationMAC(confirmationCode, email);
  return `/reservation/${confirmationCode}/${mac}`;
}
