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
import screenshot from '@lib/screenshot';
import { SITE_URL, SAMPLE_TICKET_NUMBER } from '@lib/constants';
import redis from '@lib/redis';

const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

export default async function ticketImages(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method Not Allowed');
  }

  const { username } = req.query || {};
  if (typeof username !== 'string') {
    return res.status(404).send('Not Found');
  }

  if (username.length > 39 || !GITHUB_USERNAME_PATTERN.test(username)) {
    return res.status(400).send('Invalid username');
  }

  try {
    let url: string;

    if (redis) {
      const [name, ticketNumber] = await redis.hmget(
        `user:${username}`,
        'name',
        'ticketNumber'
      );
      if (!ticketNumber) {
        return res.status(404).send('Not Found');
      }
      url = `${SITE_URL}/ticket-image?username=${encodeURIComponent(
        username
      )}&ticketNumber=${encodeURIComponent(ticketNumber)}`;
      if (name) {
        url = `${url}&name=${encodeURIComponent(name)}`;
      }
    } else {
      url = `${SITE_URL}/ticket-image?ticketNumber=${encodeURIComponent(SAMPLE_TICKET_NUMBER)}`;
    }

    const file = await screenshot(url);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Cache-Control',
      'public, immutable, no-transform, s-maxage=31536000, max-age=31536000'
    );
    return res.status(200).send(file);
  } catch (_error) {
    // Do not expose browser/Redis/provider details to the caller.
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).send('Image generation unavailable');
  }
}
