import { APP_NODE } from './app.ts';
import { USER_SELF } from './user.ts';

/** Raw item of `GET /v2/organisations/:ownerId/applications/:appId/deployments`, as returned by the API. */
export interface RawDeployment {
  id: number;
  uuid: string;
  date: number;
  state: string;
  action: string;
  commit: string | null;
  cause: string;
  instances: number;
  author: { id: string | null; name: string | null };
}

/**
 * Last successful deployment of `APP_NODE`, the one its instances run. `id` is a number, the instances reference `uuid`
 * (`deployId` in v2, `deploymentId` in v4) and show its `id` as `deployNumber`.
 */
export const DEPLOYMENT_NODE_OK = {
  id: 1,
  uuid: 'deployment_00000000-0000-4000-8000-000000000400',
  date: 1700000000000,
  state: 'OK',
  action: 'DEPLOY',
  commit: APP_NODE.commitId,
  cause: 'Git push',
  instances: 1,
  author: { id: USER_SELF.id, name: null },
} satisfies RawDeployment;

/**
 * Ongoing deployment of `APP_NODE`. The CLI cancels it with its numeric `id` in the path and prints its `uuid` to the
 * user.
 */
export const DEPLOYMENT_NODE_WIP = {
  id: 2,
  uuid: 'deployment_00000000-0000-4000-8000-000000000401',
  date: 1700000600000,
  state: 'WIP',
  action: 'DEPLOY',
  commit: '0000000000000000000000000000000000000401',
  cause: 'Git push',
  instances: 1,
  author: { id: USER_SELF.id, name: null },
} satisfies RawDeployment;
