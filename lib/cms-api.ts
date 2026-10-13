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
import { Job, Sponsor, Stage, Speaker } from '@lib/types';

import * as datoCmsApi from './dato';

const cmsApi: {
  getAllSpeakers: () => Promise<Speaker[]>;
  getAllStages: () => Promise<Stage[]>;
  getAllSponsors: () => Promise<Sponsor[]>;
  getAllJobs: () => Promise<Job[]>;
} = datoCmsApi;

async function safeCollection<T>(label: string, load: () => Promise<T[]>): Promise<T[]> {
  try {
    const items = await load();
    if (Array.isArray(items)) {
      return items;
    }

    // eslint-disable-next-line no-console
    console.warn(`[cms] ${label} returned an invalid collection`);
    return [];
  } catch (_error) {
    // Keep builds and request-time fallbacks recoverable when the CMS is
    // unavailable. Provider errors stay server-side and are not reflected to users.
    // eslint-disable-next-line no-console
    console.warn(`[cms] ${label} unavailable`);
    return [];
  }
}

export async function getAllSpeakers(): Promise<Speaker[]> {
  return safeCollection('speakers', cmsApi.getAllSpeakers);
}

export async function getAllStages(): Promise<Stage[]> {
  return safeCollection('stages', cmsApi.getAllStages);
}

export async function getAllSponsors(): Promise<Sponsor[]> {
  return safeCollection('sponsors', cmsApi.getAllSponsors);
}

export async function getAllJobs(): Promise<Job[]> {
  return safeCollection('jobs', cmsApi.getAllJobs);
}
