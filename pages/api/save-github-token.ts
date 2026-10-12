/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import redis from '@lib/redis';
import { COOKIE } from '@lib/constants';

export default async function saveGithubToken(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(501).json({
      error: {
        code: 'method_unknown',
        message: 'This endpoint only responds to POST'
      }
    });
  }

  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
    ? req.body as Record<string, unknown>
    : {};

  if (
    typeof body.token !== 'string' || body.token.length < 1 || body.token.length > 256 ||
    typeof body.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(body.id)
  ) {
    return res.status(400).json({
      error: {
        code: 'bad_input',
        message: 'Invalid parameters'
      }
    });
  }

  // The registration is owned by the HttpOnly cookie issued by /api/register.
  // A caller-provided id is not authorization to alter another attendee's ticket.
  const sessionId = req.cookies[COOKIE];
  const fetchSite = req.headers['sec-fetch-site'];
  if (!sessionId || body.id !== sessionId ||
      (typeof fetchSite === 'string' && fetchSite !== 'same-origin')) {
    return res.status(403).json({ error: { code: 'forbidden', message: 'Registration session is required' } });
  }

  if (!redis) {
    return res.status(503).json({ error: { code: 'unavailable', message: 'Registration storage is not configured' } });
  }

  const ticketNumber = await redis.hget(`id:${body.id}`, 'ticketNumber');
  if (!ticketNumber) {
    return res.status(404).json({ code: 'invalid_id', message: 'The registration does not exist' });
  }

  const [username, name] = await redis.hmget(`github-user:${body.token}`, 'login', 'name');
  if (!username) {
    return res.status(400).json({ code: 'invalid_token', message: 'Invalid or expired token' });
  }

  const key = `id:${body.id}`;
  const userKey = `user:${username}`;

  await redis
    .multi()
    .hsetnx(key, 'username', username)
    .hsetnx(key, 'name', name || '')
    // Also save username → data pair
    .hsetnx(userKey, 'name', name || '')
    .hsetnx(userKey, 'ticketNumber', ticketNumber)
    .exec();

  res.json({ username, name });
}
