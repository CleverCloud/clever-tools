import type { AppConfigFileApp } from '../clever-fs-mock.ts';
import { APP_ID, USER_ID } from './id.ts';

/** Application of the user as linked in `.clever.json` by `clever link`, under the alias `my-alias`. */
export const LINKED_APP: AppConfigFileApp = {
  app_id: APP_ID,
  org_id: USER_ID,
  deploy_url: `https://push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
  git_ssh_url: `git+ssh://git@push-n0-par-clevercloud-customers.services.clever-cloud.com/${APP_ID}.git`,
  name: 'my-app',
  alias: 'my-alias',
};
