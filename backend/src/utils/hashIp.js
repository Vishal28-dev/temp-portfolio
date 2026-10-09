import { createHmac } from 'node:crypto';
import { env } from '../config/env.js';

/**
 * One-way, salted. Analytics can count unique visitors without ever
 * storing an address that could identify one.
 */
export const hashIp = (ip) =>
  createHmac('sha256', env.IP_HASH_SALT).update(String(ip ?? '')).digest('hex').slice(0, 32);
