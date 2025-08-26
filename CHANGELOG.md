# clever-tools changelog


## [3.14.1](https://github.com/CleverCloud/clever-tools/compare/3.14.0...3.14.1) (2025-08-26)


### 🐛 Bug Fixes

* handle correctly add-ons option including "-" ([09c2c50](https://github.com/CleverCloud/clever-tools/commit/09c2c508d998239694f07900c278ff37cd8cd3cd))

## [3.14.0](https://github.com/CleverCloud/clever-tools/compare/3.13.1...3.14.0) (2025-07-29)


### 🚀 Features

* add 'clever-tools' as binary ([e9dd580](https://github.com/CleverCloud/clever-tools/commit/e9dd580978b752d109477429aa110040dc0bf30d))
* **service:** print a message if there is no linked service ([3d4c2bc](https://github.com/CleverCloud/clever-tools/commit/3d4c2bcc4290516b53922635bc440f0af7476bbd))


### 🐛 Bug Fixes

* remove duplicate --format option for operators version check ([9b92ff1](https://github.com/CleverCloud/clever-tools/commit/9b92ff1e08d1fd0f7d047684206df6ac5b26fe4c))
* **service:** only print linked add-ons if --show-all is not true ([5668c08](https://github.com/CleverCloud/clever-tools/commit/5668c08daef3ed304f470923e6f36a9eaa369644))

## [3.13.1](https://github.com/CleverCloud/clever-tools/compare/3.13.0...3.13.1) (2025-06-18)


### 🐛 Bug Fixes

* logs with color ([db3221b](https://github.com/CleverCloud/clever-tools/commit/db3221be205181b591c539db5775ee92d5dd4393))

## [3.13.0](https://github.com/CleverCloud/clever-tools/compare/3.12.0...3.13.0) (2025-06-10)


### 🚀 Features

* **addon:** remove beta status from Keycloak, Matomo, Metabase and Otoroshi ([adc6b5c](https://github.com/CleverCloud/clever-tools/commit/adc6b5c58514b4d5067744d374650f5bdfa8d808))
* **cancel-deploy:** improve display (texts and colors) ([c8614e9](https://github.com/CleverCloud/clever-tools/commit/c8614e9c11eefb41b55635084112cb70d6bbf5e2))
* **config:**
  * add support for "task" config ([deb3e26](https://github.com/CleverCloud/clever-tools/commit/deb3e261c30a5cda0fb9d1ffb88aaca284364aa0))
  * improve display for `list`, `get`, `set` and `update` commands ([e277eb1](https://github.com/CleverCloud/clever-tools/commit/e277eb1916e4d49f6b75ec42e58635aad9e89172))
* **create:** improve display (texts and colors) ([c36ebc9](https://github.com/CleverCloud/clever-tools/commit/c36ebc905e5fde258ab9c7a884e000a23280ad2f))
* **delete:** improve display (texts and colors) ([c8e5c93](https://github.com/CleverCloud/clever-tools/commit/c8e5c93ba92b6d1b0bd6783fae591f04bc48302f))
* **deploy:** improve display (texts and colors) ([1e055f3](https://github.com/CleverCloud/clever-tools/commit/1e055f3ee6ca4b27d53d6864e7071422be43a7ae))
* **emails:** add emails command ([0a5210f](https://github.com/CleverCloud/clever-tools/commit/0a5210fbc88886d0a67c892c872d5c42fdd4e7c7))
* **features:** add `operator` feature for `keycloak`, `matomo`, `metabase` and `otoroshi` ([f782359](https://github.com/CleverCloud/clever-tools/commit/f782359a06abcb03363b2ef02580a724341aa495))
* **keycloak:** add keycloak command ([6dc2c59](https://github.com/CleverCloud/clever-tools/commit/6dc2c594cfaaf41c0982cdb75422ba606aaf4356))
* **link:** improve display (texts and colors) ([5896bbd](https://github.com/CleverCloud/clever-tools/commit/5896bbd195c6f9d9c0abbeb3e4f27a5236465c96))
* **make-default:** improve display (texts and colors) ([addcac6](https://github.com/CleverCloud/clever-tools/commit/addcac64b259a92dc2e7b5b68d4b1166e0f4d488))
* **matomo:** add matomo command ([8f3dafd](https://github.com/CleverCloud/clever-tools/commit/8f3dafd992ef79a6956b422f79316b3f5ef66cf8))
* **metabase:** add metabase command ([8e29490](https://github.com/CleverCloud/clever-tools/commit/8e29490682637ba8af56e681396de808a888bad5))
* **otoroshi:** add otoroshi command ([439ae13](https://github.com/CleverCloud/clever-tools/commit/439ae135cbb3ca7bde5feadbeffca8b27ba4db6c))
* **restart:** improve display (texts and colors) ([248c47a](https://github.com/CleverCloud/clever-tools/commit/248c47ad45c92e39fe668f33b9af6600593ff3aa))
* **ssh-keys:** add ssh-keys command ([2900328](https://github.com/CleverCloud/clever-tools/commit/29003284fcfe34dc27de02335e642e3104bc5f78))
* **stop:** improve display (texts and colors) ([48fa89f](https://github.com/CleverCloud/clever-tools/commit/48fa89f92ed181424146a19f35846907af0f927a))
* **tokens:**
  * add "state" in tokens list ([0ec7cc0](https://github.com/CleverCloud/clever-tools/commit/0ec7cc087ec99852c4bfda6f0557b227ee8e811d))
  * handle users with no password set ([2e6576d](https://github.com/CleverCloud/clever-tools/commit/2e6576de313c90e96e79009e1ee8bc0436258da1))
  * make `clever tokens` available without the feature flag ([9722d5b](https://github.com/CleverCloud/clever-tools/commit/9722d5bff6bd36103535eaef0124d2fcdb979e1f))
* **unlink:** improve display (texts and colors) ([3b27d74](https://github.com/CleverCloud/clever-tools/commit/3b27d74128545df3abefb4b7cd115ad0c7a47675))


### 🐛 Bug Fixes

* apply strict text transformation on apps names for aliases and git remotes ([9b936c9](https://github.com/CleverCloud/clever-tools/commit/9b936c9032e08aa426dc360f89e306030c3ec583))
* **config:**
  * exit with error if --enable-* and --disable-* are used at the same time ([f137732](https://github.com/CleverCloud/clever-tools/commit/f1377328c1fe0e7aea401cdf7d2736c1504e8bb5))
  * exit with error if config name is unknown ([788ac36](https://github.com/CleverCloud/clever-tools/commit/788ac36d3a4505b36739f07a4287b8b4ee298eae))
  * reject non boolean values for some config ([7080825](https://github.com/CleverCloud/clever-tools/commit/708082589510bf27ec2c49e415cf34784b4502a8))
  * remove undocumented behavior for `clever config CONFIG_NAME` ([3c1a19e](https://github.com/CleverCloud/clever-tools/commit/3c1a19ee478131abfd177733bcab128ac4633ec9))
* **delete:**
  * exit with error if app doesn't exist ([7ac000c](https://github.com/CleverCloud/clever-tools/commit/7ac000ca1cdbc4d1dfed094958eea9feb8e5b286))
  * remove default app from `.clever.json` ([97233db](https://github.com/CleverCloud/clever-tools/commit/97233db1c909c322a5d5636e6548890c7bc94676))
* **unlink:** remove default app from `.clever.json` ([97233db](https://github.com/CleverCloud/clever-tools/commit/97233db1c909c322a5d5636e6548890c7bc94676))

## [3.12.0](https://github.com/CleverCloud/clever-tools/compare/3.11.0...3.12.0) (2025-03-06)


### 🚀 Features

* **database:** stream backup download ([80940a3](https://github.com/CleverCloud/clever-tools/commit/80940a37d193a2922cd72383f6d7432b057b00d1))
* display a proper message for any 401 from the API ([379c866](https://github.com/CleverCloud/clever-tools/commit/379c8667c2c4b74e2e0edbec547f2ff0b3657e97))
* **docker:** add curl and jq binaries ([3b71f0e](https://github.com/CleverCloud/clever-tools/commit/3b71f0e83dde74621463494a1eaade29fc7e35a5))
* **ng:** introduce ng command ([687042b](https://github.com/CleverCloud/clever-tools/commit/687042bef5a27d50fcd9060cf1a68b9c61dee05b))
* **tokens:** add `clever tokens` command to manage API tokens ([7044860](https://github.com/CleverCloud/clever-tools/commit/7044860ee24946d044d0fbc188ee407577c3fda4))


### 🐛 Bug Fixes

* **domains/overview:** handle 403 errors ([cdd6bac](https://github.com/CleverCloud/clever-tools/commit/cdd6bacc26293c4b023ac5f476b0b2b3fcf3f005)), closes [#881](https://github.com/CleverCloud/clever-tools/issues/881)
* **link:** ignore org ID when using an app ID ([d2301ff](https://github.com/CleverCloud/clever-tools/commit/d2301ff74402491a30b901da8418aaac03f2947e))

## [3.11.0](https://github.com/CleverCloud/clever-tools/compare/3.10.1...3.11.0) (2024-12-18)


### 🚀 Features

* **features:** introduce `features` command ([5c370b3](https://github.com/CleverCloud/clever-tools/commit/5c370b3bdb0ad99509004491f9360f20c0a36632))
* **kv:** introduce `kv` command ([70f8aba](https://github.com/CleverCloud/clever-tools/commit/70f8abafb4539c9587335ced87d5c414a012159e))
* **profile:** open in the Console ([4ee9730](https://github.com/CleverCloud/clever-tools/commit/4ee97300db24de8d4c93acb79f2f92ef9066f5e2))


### 🐛 Bug Fixes

* **config:** directory creation on write ([05b97d6](https://github.com/CleverCloud/clever-tools/commit/05b97d6f9198c74e3c21ea9a632d52ff884e9799))
* **rollup:** prevent build failure on MacOS ([8a6871f](https://github.com/CleverCloud/clever-tools/commit/8a6871ff4738f2442aa9f4c880a9a61abc7e78c9)), closes [#864](https://github.com/CleverCloud/clever-tools/issues/864)

## [3.10.1](https://github.com/CleverCloud/clever-tools/compare/3.10.0...3.10.1) (2024-11-29)


### 🐛 Bug Fixes

* **addon:** better handle options parsing ([7005bbf](https://github.com/CleverCloud/clever-tools/commit/7005bbf4a12bd31c0b1949418f35f2476d032240)), closes [#856](https://github.com/CleverCloud/clever-tools/issues/856)

## [3.10.0](https://github.com/CleverCloud/clever-tools/compare/3.9.0...3.10.0) (2024-11-27)


### 🚀 Features

* **addon:** elastic plugins option support ([2ec8651](https://github.com/CleverCloud/clever-tools/commit/2ec865153b602b8fdcbb1304d4ca171e5acd2341))


### 🐛 Bug Fixes

* **domain:** add missing spacing within diag report ([7b0c739](https://github.com/CleverCloud/clever-tools/commit/7b0c739617ca13f62fcca2ca4c71d9beb48433b3))
* **domains/overview:** handle wildcard domains properly ([5d503fe](https://github.com/CleverCloud/clever-tools/commit/5d503feccd7f251b7940473809afc8b779e06ace)), closes [#847](https://github.com/CleverCloud/clever-tools/issues/847)

## [3.9.0](https://github.com/CleverCloud/clever-tools/compare/3.8.3...3.9.0) (2024-10-23)


### 🚀 Features

* **addon:** add Keycloak temporary password instructions ([cc66497](https://github.com/CleverCloud/clever-tools/commit/cc664977ba565c267bf0c37bc761a12b654784cb))
* **addon:** add URL to use/manage add-on at creation ([36226c5](https://github.com/CleverCloud/clever-tools/commit/36226c566e2b7468f38297f57a80c198e90c1f9c))
* **addon:** enable string value for option keys ([9f36289](https://github.com/CleverCloud/clever-tools/commit/9f36289f49389aafb7fe4d01920bcef7c81a0519))
* **domain:** init `diag` command ([d0ce64c](https://github.com/CleverCloud/clever-tools/commit/d0ce64cbbd8ebfefff9560712e2fd4366978c31b))
* **domain:** init `overview` command ([32e4294](https://github.com/CleverCloud/clever-tools/commit/32e4294855e306fe3e139b4590ad366d3807801a))
* **profile**: add token expiry to clever profile ([8b6be6e](https://github.com/CleverCloud/clever-tools/commit/8b6be6e6d05af7e679f35598268cc7ba888eee37))


### 🐛 Bug Fixes

* **addon:** update Beta providers list ([83fd0b9](https://github.com/CleverCloud/clever-tools/commit/83fd0b91456d7da42147578808704854ecf91762))
* display stacktraces in verbose mode (again) ([a5f46d6](https://github.com/CleverCloud/clever-tools/commit/a5f46d6b519147e34dd0d78db42b2c804ac6d4a1))

## [3.8.3](https://github.com/CleverCloud/clever-tools/compare/3.8.2...3.8.3) (2024-09-11)


### 🐛 Bug Fixes

* addon delete without org parameter ([24cfd5a](https://github.com/CleverCloud/clever-tools/commit/24cfd5ae8826c71107d7b381d40a77d3511c8c85)), closes [#811](https://github.com/CleverCloud/clever-tools/issues/811)
* **dependencies:** remove `text-table` from `devDependencies` ([bf020bf](https://github.com/CleverCloud/clever-tools/commit/bf020bf3b7666376d37973bd32999231e4d094df)), closes [#819](https://github.com/CleverCloud/clever-tools/issues/819)
* **update-notifier:** change the docs URL within the update message ([1803dce](https://github.com/CleverCloud/clever-tools/commit/1803dce27d756833d30ce01674eccf73457b9570))
* **update-notifier:** set `isGlobal` to `true` ([1987408](https://github.com/CleverCloud/clever-tools/commit/198740805450c3e5399db88be5c545e6136c1afd)), closes [#812](https://github.com/CleverCloud/clever-tools/issues/812)

## [3.8.2](https://github.com/CleverCloud/clever-tools/compare/3.8.1...3.8.2) (2024-08-22)


### 🐛 Bug Fixes

* **drain:** default index-prefix for elasticsearch drain should be null ([d38d0ae](https://github.com/CleverCloud/clever-tools/commit/d38d0aeadfe67d3548550eba14d4debc3029e73d))

## [3.8.1](https://github.com/CleverCloud/clever-tools/compare/3.8.0...3.8.1) (2024-07-02)


### 🐛 Bug Fixes

* **addon:** status of Keycloak ([fe64a91](https://github.com/CleverCloud/clever-tools/commit/fe64a911e8055a2e544de2fd313592026330c1c8))
* **drain:** remove double --addon option ([b978024](https://github.com/CleverCloud/clever-tools/commit/b97802450d6ea8f8934346463c7a19bb9048c407)), closes [#786](https://github.com/CleverCloud/clever-tools/issues/786)

## [3.8.0](https://github.com/CleverCloud/clever-tools/compare/3.7.0...3.8.0) (2024-07-01)


### 🚀 Features

* **accesslogs:** support --app argument ([d774a74](https://github.com/CleverCloud/clever-tools/commit/d774a749424dd7aaaa6be825749f4df2f3cf4857))
* **accesslogs:** use API v4 and disable add-on support for now ([619095d](https://github.com/CleverCloud/clever-tools/commit/619095d99b10ce710e197fba31b72fcf14e3f71e))
* **activity:** add `--format json|json-stream|human` option ([da23737](https://github.com/CleverCloud/clever-tools/commit/da23737a3ec40b1fd157f8dab6a2783ccb61383a)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **activity:** support --app argument ([9431f31](https://github.com/CleverCloud/clever-tools/commit/9431f31bb8fea2c4d1ad2542051d357fcf170ea3))
* add a --no-color global option ([90a4e10](https://github.com/CleverCloud/clever-tools/commit/90a4e107185b23e6761e8e64b902cb79c5c445c0)), closes [#631](https://github.com/CleverCloud/clever-tools/issues/631)
* **addon providers show:** add `--format json|human` option ([23bfac6](https://github.com/CleverCloud/clever-tools/commit/23bfac60400f05b277fd2392e50c39bd439580e8)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **addon providers:** add `--format json|human` option ([9b806a1](https://github.com/CleverCloud/clever-tools/commit/9b806a142f7f0e7b304daee7f56b2c736f8556a5)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **applications:** add list subcommand to list all applications ([f654588](https://github.com/CleverCloud/clever-tools/commit/f6545889d98a585510516a7ee56b7c41dad6466d))
* **cancel-deploy:** support --app argument ([4e9d859](https://github.com/CleverCloud/clever-tools/commit/4e9d859f61395ca74a1aaf53773af3c59515dbac))
* **config:** support --app argument ([2614111](https://github.com/CleverCloud/clever-tools/commit/2614111316480ba62fe4c1f3b55d181f1e0b91e8))
* **console:** open the Console even if no app is linked ([111fc51](https://github.com/CleverCloud/clever-tools/commit/111fc519a76f4bf3e69455c2a4cd196818905c50))
* **console:** support --app argument ([7253799](https://github.com/CleverCloud/clever-tools/commit/725379950492c1b3610aee47c340125dcc7a9ae5))
* **delete:** support --app argument ([7b4d6da](https://github.com/CleverCloud/clever-tools/commit/7b4d6da73d83d5e1fadc39e9f48de9a69703f2e0))
* **deploy,restart:** handle exit-on option to end deployment logs ([f2e1981](https://github.com/CleverCloud/clever-tools/commit/f2e1981fe09f09de9ee68e41ec02199e6823e76d))
* **diag:** add `--format json|human` option ([922515e](https://github.com/CleverCloud/clever-tools/commit/922515e472aa85d1f1e27126c8c25282a406fa55)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **domain:** support --app argument ([19d3f8e](https://github.com/CleverCloud/clever-tools/commit/19d3f8e8362effb7547943d4792bc817b5502f77))
* **drain:** add `--format json|human` option ([e0f70c2](https://github.com/CleverCloud/clever-tools/commit/e0f70c2559d5f54599ff5ad2fb8fd0ece6e7d9fa)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **drain:** support --app argument ([a45f0bd](https://github.com/CleverCloud/clever-tools/commit/a45f0bdbd975069fad5326926aff51cf29dd848b))
* **env:** add `--format json|shell|human` option ([fcb25ff](https://github.com/CleverCloud/clever-tools/commit/fcb25ff0afd0eb32316561457f5b48d3aa09b2df)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **env:** support --app argument ([8b02f0b](https://github.com/CleverCloud/clever-tools/commit/8b02f0b9f4206e1a823a148fdcb327842dbd52b7))
* **logs:** support --app argument ([4cb62bf](https://github.com/CleverCloud/clever-tools/commit/4cb62bf42b19a8eab0aceba1b0bb4d4364d6be38))
* **notify-email:** add `--format json|human` option ([6cc4e16](https://github.com/CleverCloud/clever-tools/commit/6cc4e165413afdb0f8f8810f6057748866d8fade)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **open:** support --app argument ([3121d0d](https://github.com/CleverCloud/clever-tools/commit/3121d0da5696d3d886608f4eae370af806fe74a3))
* **profile:** add `--format json|human` option ([2ce27f2](https://github.com/CleverCloud/clever-tools/commit/2ce27f2e988de3ca99b630af4ae265e727f3b2b0)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **published-config:** add `--format json|shell|human` option ([8dd42c9](https://github.com/CleverCloud/clever-tools/commit/8dd42c98a15d3f7accfd194ee659badab8258325)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **published-config:** support --app argument ([7f68430](https://github.com/CleverCloud/clever-tools/commit/7f684305449655ade6563eadbb199dc524d797d9))
* **restart:** support --app argument ([1ac6074](https://github.com/CleverCloud/clever-tools/commit/1ac6074b305a9ecb1a10945fe3fdcc615f209ceb))
* **scale:** support --app argument ([5e89327](https://github.com/CleverCloud/clever-tools/commit/5e893272b0fc3d3a6211ab8c287cff14f51127dd))
* **service:** add `--format json|human` option ([0f23885](https://github.com/CleverCloud/clever-tools/commit/0f238856d72a9355a329d742f310acf9707c8166)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **service:** support --app argument ([0f02f78](https://github.com/CleverCloud/clever-tools/commit/0f02f78c3aaa964decf5cd865ef1a90f4761363e))
* **ssh:** support --app argument ([c1ef739](https://github.com/CleverCloud/clever-tools/commit/c1ef739d5dd9fa4717b0ac1b782f668c3d72a81f))
* **status:** add `--format json|human` option ([d929587](https://github.com/CleverCloud/clever-tools/commit/d9295871c970c0a6ded1b5c54627882ea7df6aac)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **status:** support --app argument ([62428c9](https://github.com/CleverCloud/clever-tools/commit/62428c92e176fa282c608274a0ab6e54d0a5c59e))
* **stop:** support --app argument ([7d27b0b](https://github.com/CleverCloud/clever-tools/commit/7d27b0b8debaace136d7bf7679de5861e65683cc))
* **tcp-redirs list-namespaces:** add `--format json|human` option ([02e9a9d](https://github.com/CleverCloud/clever-tools/commit/02e9a9d09c99fad1bc5c63e9f02f9d38f70f61f6)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **tcp-redirs:** add `--format json|human` option ([8d14c6e](https://github.com/CleverCloud/clever-tools/commit/8d14c6e5ebb38719ceec55d45e14c1ef01d08d7b)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)
* **tcp-redirs:** support --app argument ([dd0219c](https://github.com/CleverCloud/clever-tools/commit/dd0219c4debac88fa12330bf1f79976010d0d0ac))
* **webhooks:** add `--format json|human` option ([4f0f9ae](https://github.com/CleverCloud/clever-tools/commit/4f0f9aee164feaea9504afff3719aefb8e32ea7f)), closes [#589](https://github.com/CleverCloud/clever-tools/issues/589)


### 🐛 Bug Fixes

* **addon:** add missing `--format FORMAT` option ([cbe6fef](https://github.com/CleverCloud/clever-tools/commit/cbe6fef57a4458af404bbac76d39185433f37a3f))
* **drain:** wrong link between command option and its processing ([fb2bae0](https://github.com/CleverCloud/clever-tools/commit/fb2bae07fb861270fdb99b75b0e2b763d2324176))
* remove automatic colors when console.error and console.warn are used ([f630c19](https://github.com/CleverCloud/clever-tools/commit/f630c196b259104727cc9024c43f3dee492c6d74)), closes [#768](https://github.com/CleverCloud/clever-tools/issues/768)
* rework --no-update-notifier global option behavior ([0acab8b](https://github.com/CleverCloud/clever-tools/commit/0acab8bebcffb18aa14832c858a6f8abf2fe598e)), closes [#649](https://github.com/CleverCloud/clever-tools/issues/649)

## [3.7.0](https://github.com/CleverCloud/clever-tools/compare/3.6.1...3.7.0) (2024-06-11)


### 🚀 Features

* **activity:** add deployment id ([094ce7c](https://github.com/CleverCloud/clever-tools/commit/094ce7c93518d31884eaa0f4953c41bd8f944a8e)), closes [#430](https://github.com/CleverCloud/clever-tools/issues/430) [#193](https://github.com/CleverCloud/clever-tools/issues/193)
* **activity:** shorten commit id ([a977360](https://github.com/CleverCloud/clever-tools/commit/a977360d34850d2a1280b5bab84f9c032455d03b))
* **addon create:** choose the cheapest plan by default ([87376f8](https://github.com/CleverCloud/clever-tools/commit/87376f8ac3c03cdf01082e13bfbe8c637d951d2d)), closes [#653](https://github.com/CleverCloud/clever-tools/issues/653)
* **addon:** list available addon providers when invalid provider is specified ([e7684fe](https://github.com/CleverCloud/clever-tools/commit/e7684fe6817780f726318d1d0fdbedec01c448c5))


### 🐛 Bug Fixes

* **activity:** fix activity list refresh when `--follow` options is enabled ([04e0133](https://github.com/CleverCloud/clever-tools/commit/04e0133cdabadeed70e4494d73fcbc52fee7aea8))
* fix clever curl in packaged and node version ([0ef585f](https://github.com/CleverCloud/clever-tools/commit/0ef585f949553f4d884362a48b7691b1289887a1))

## [3.6.1](https://github.com/CleverCloud/clever-tools/compare/3.6.0...3.6.1) (2024-04-18)


### 🐛 Bug Fixes

* **build:** fix npm package ([df30809](https://github.com/CleverCloud/clever-tools/commit/df308095e9e3af7dc78ecb1f4a2bffbeffbe9a38)), closes [#729](https://github.com/CleverCloud/clever-tools/issues/729)

## [3.6.0](https://github.com/CleverCloud/clever-tools/compare/3.5.2...3.6.0) (2024-04-16)


### 🚀 Features

* **logs:** support SD-PARAM RFC5424 for UDP and TCP drains ([38407ad](https://github.com/CleverCloud/clever-tools/commit/38407adff14c5d49581181b37afadb9b8e41ea24))


### 🐛 Bug Fixes

* **addon:** add TLS param to Materia KV connect info ([dcd01c1](https://github.com/CleverCloud/clever-tools/commit/dcd01c1ab2b0eb93a9ec9063d21f393216d95b4c))
* **addon:** allow json format in new list subcommand ([cec0e85](https://github.com/CleverCloud/clever-tools/commit/cec0e8567286e1b56459fbc5e53da91b8ad7765b))
* **logs:** add details about configuration for specific drains ([55054d4](https://github.com/CleverCloud/clever-tools/commit/55054d430c4b2bcec73cbfbd20fe9e63706c82fe))

## [3.5.2](https://github.com/CleverCloud/clever-tools/compare/3.5.1...3.5.2) (2024-04-11)


### 🐛 Bug Fixes

* **curl:** fix clever curl command when used with the auto packaged binary version ([7197f29](https://github.com/CleverCloud/clever-tools/commit/7197f2967ea298672600ed6080f43b6d5e04adf7)), closes [#713](https://github.com/CleverCloud/clever-tools/issues/713)

## [3.5.1](https://github.com/CleverCloud/clever-tools/compare/3.5.0...3.5.1) (2024-04-10)


### 🐛 Bug Fixes

* **build:** fix PKGBUILD template for arch/AUR build ([71d37f0](https://github.com/CleverCloud/clever-tools/commit/71d37f04c50fe592dc8a8ed9e74d8553404faa67)), closes [#708](https://github.com/CleverCloud/clever-tools/issues/708)

## [3.5.0](https://github.com/CleverCloud/clever-tools/compare/3.4.0...3.5.0) (2024-04-08)


### 🚀 Features

* **addon:** enable Materia KV ([341a3fa](https://github.com/CleverCloud/clever-tools/commit/341a3fa9b4d74d422750b6755c59dadeb5a584b1))
* **addon:** support JSON format when plotting an add-on list ([d01b3e0](https://github.com/CleverCloud/clever-tools/commit/d01b3e01db9097dad2e77347525a273732c7ffe9))
* **backups:** support JSON format when plotting a backup list ([c51c028](https://github.com/CleverCloud/clever-tools/commit/c51c028b8d25fd25d2bac91e408c63ae3acdfea9))
* **create:** add the ability to create an app as a task ([c217772](https://github.com/CleverCloud/clever-tools/commit/c217772638035cab0c6f26a75c250759ab5d0cdc))
* **curl:** add a clever curl help message ([520d04b](https://github.com/CleverCloud/clever-tools/commit/520d04b08d34acfcb924c81a12fc79b8192b87d0))
* **curl:** list the command in clever help ([b6e18d2](https://github.com/CleverCloud/clever-tools/commit/b6e18d2ec27c372cd34cffd850a29618085c1cf6))
* **database-backups:** rework json backup list ([5cbb381](https://github.com/CleverCloud/clever-tools/commit/5cbb381f11f52ad9f14aa6dca243cb30431f63fb))
* **help:** adjust description for help command ([85b3dec](https://github.com/CleverCloud/clever-tools/commit/85b3decce9ea55cf6b5a21d2eb8a9a8be09da84d))
* **logs:** support duration in since parameters ([a223f3a](https://github.com/CleverCloud/clever-tools/commit/a223f3a77a20c6f062e8003a9548072aff0c657f))
* **logs:** support indexPrefix customization for ElasticSearch log drain ([2dc0bd6](https://github.com/CleverCloud/clever-tools/commit/2dc0bd655b2b49b32bd749d5bf20b22841448446))
* **parsers:** add duration parser ([62d6089](https://github.com/CleverCloud/clever-tools/commit/62d60893dc6214567869b31a54e208656661b634))
* **status:** show instance lifetime (TASK/REGULAR) in status ([5c67aa7](https://github.com/CleverCloud/clever-tools/commit/5c67aa76fe59ac4c242918a83d647eb038ce2fc3))


### 🐛 Bug Fixes

* **logs:** allow real ID for addons with `clever logs` ([b50ae3e](https://github.com/CleverCloud/clever-tools/commit/b50ae3ed8344b99d8f4837700ab6dc440179446f)), closes [#710](https://github.com/CleverCloud/clever-tools/issues/710)
* **logs:** fix logs for addon (when no linked apps) ([8c6d6f1](https://github.com/CleverCloud/clever-tools/commit/8c6d6f1ddc3d9f2c0d8f0bdab2bde9310f3f5f04)), closes [#644](https://github.com/CleverCloud/clever-tools/issues/644)
* **restart:** quieter mode ([e507113](https://github.com/CleverCloud/clever-tools/commit/e507113675de50c4a7e751add270deac8c260f6e))

## [3.4.0](https://github.com/CleverCloud/clever-tools/compare/3.3.0...3.4.0) (2024-02-16)


### 🚀 Features

* **addon-create:** add support for JSON format (-F json) ([334cec5](https://github.com/CleverCloud/clever-tools/commit/334cec56a43e0e511a4eaae17350a6caea912576))
* **create:** add support for JSON format (-F json) ([1f7842a](https://github.com/CleverCloud/clever-tools/commit/1f7842a3a9d0e4f8b1d235f13fd6c5dc06dc0fc0))
* **create:** display name once app (or add-on) is created ([1a3eb9e](https://github.com/CleverCloud/clever-tools/commit/1a3eb9ea9acf44aebc431b617cbf7d522b27d880))
* **create:** make app name optional (use current directory name if not specified) ([0a20393](https://github.com/CleverCloud/clever-tools/commit/0a2039302f8c237616e0ba48de97a2b1de89ec88))
* **deploy:** support tag option ([52ea270](https://github.com/CleverCloud/clever-tools/commit/52ea270b5148d29b5c52d01321541b2227437f0a))
* **logs:** support "json" and "json-stream" formats (for apps only) ([a909959](https://github.com/CleverCloud/clever-tools/commit/a909959314a3d5465d040304b2ee0036b35cde28))


### 🐛 Bug Fixes

* **docker:** inject Docker hub credentials to actions ([e5e546e](https://github.com/CleverCloud/clever-tools/commit/e5e546e88d5ff5f93de1384615619b883ea278bc))

## [3.3.0](https://github.com/CleverCloud/clever-tools/compare/3.2.0...3.3.0) (2024-02-15)


### 🚀 Features

* add new Gravelines HDS region to autocomplete ([fbebd40](https://github.com/CleverCloud/clever-tools/commit/fbebd406f674bbebc1e9e88a84f2e8270e6b0f7a))


### 🐛 Bug Fixes

* **logs:** show addon logs when addonId is provided ([6fb99d5](https://github.com/CleverCloud/clever-tools/commit/6fb99d591c0832e0cfb556f208ae479932b8d5af))

## [3.2.0](https://github.com/CleverCloud/clever-tools/compare/3.1.0...3.2.0) (2024-02-07)


### 🚀 Features

* **logs:** enable auto retry on network failures ([ccab160](https://github.com/CleverCloud/clever-tools/commit/ccab160f61778ce49f9a364d5207e1d48f51d923))


### 🐛 Bug Fixes

* **api:** improve error message with `EAI_AGAIN` and `ECONNRESET` ([b134213](https://github.com/CleverCloud/clever-tools/commit/b134213f30d46dd7f5690a38425deb4fd752148c))
* delete beta/Jenkins mentions in README.md ([cb32b3b](https://github.com/CleverCloud/clever-tools/commit/cb32b3b0cdaecac5d6198f295eef7c350161ac03))
* **logs:** improve error message with `EAI_AGAIN` and `ECONNRESET` ([fada067](https://github.com/CleverCloud/clever-tools/commit/fada06771369173e579f5fd3a708ff3cef40c95f))
* **logs:** improve open and error debug message ([28dd996](https://github.com/CleverCloud/clever-tools/commit/28dd9968bec8de9545c6b940be732d3f8f87a8f9))
* **logs:** increase connection timeout ([a4ec4b9](https://github.com/CleverCloud/clever-tools/commit/a4ec4b90b5d3938e27679edeb7d375281def3776))
* **logs:** only print SSE errors as debug when verbose mode is enabled ([3ea21c6](https://github.com/CleverCloud/clever-tools/commit/3ea21c6a4ff75db8df5f8177bba10ef17c2962e0))

## [3.1.0](https://github.com/CleverCloud/clever-tools/compare/3.0.2...3.1.0) (2024-01-25)


### 🚀 Features

* **applications:** display git+ssh deployment URL ([8c702ce](https://github.com/CleverCloud/clever-tools/commit/8c702ce94c6d4f018bc1b819cee6a0ed7486b050)), closes [#619](https://github.com/CleverCloud/clever-tools/issues/619)
* **deploy:** add same-commit-policy option ([76ff6a2](https://github.com/CleverCloud/clever-tools/commit/76ff6a2fd183ee2ba0cb30dce6d07d3ae3e515cc))
* **deploy:** log application and owner details ([e5929ae](https://github.com/CleverCloud/clever-tools/commit/e5929aee0f015337fc2664224772d2a0a0301d39))
* update runtimes list in autocomplete ([f02f50f](https://github.com/CleverCloud/clever-tools/commit/f02f50f4ea1d887b4bd7ccafc36e72077ff0ab13))
* update zones list in autocomplete ([3b18adb](https://github.com/CleverCloud/clever-tools/commit/3b18adbdda2c69ac1f6d5bf77604849f5d4033d0))


### 🐛 Bug Fixes

* add an alias/name check during app create ([4a5201a](https://github.com/CleverCloud/clever-tools/commit/4a5201aca2ee3225a9b086212bd28a2295089126)), closes [#656](https://github.com/CleverCloud/clever-tools/issues/656)
* **addon:** fix a typo ([8ece4cd](https://github.com/CleverCloud/clever-tools/commit/8ece4cd56946ada1f2b6bc6f091f103b3fce1c33))
* **domain:** use response object to access status ([18fba08](https://github.com/CleverCloud/clever-tools/commit/18fba08665ce3e133d68c06db26580d2cc43d7c2))
* pass an HTTP agent with long timeout to isomorphic-git ([1bfbf40](https://github.com/CleverCloud/clever-tools/commit/1bfbf40d388cc78c9b987d3717ecd8b4e1bfe803)), closes [#640](https://github.com/CleverCloud/clever-tools/issues/640)

## 3.0.2 (2023-11-01)

* chore: update @clevercloud/client to 8.0.2 (fix Node.js < 18.16 abort bug)

## 3.0.1 (2023-10-19)

* Move from Node.js v18.5.0 to v18.15.0

## 3.0.0 (2023-10-19)

### ⚠ BREAKING CHANGES

* Move from Node.js v12.22.8 to v18.5.0

### Features

* add config file and auth source to `clever diag`
* add shell to `clever diag`
* improve `clever diag`, display (color and details) for oAuth token and user ID
* `clever deploy`: use new logs API (faster, longer, order)
* `clever restart`: use new logs API (faster, longer, order)
* `clever logs`: use new logs API (faster, longer, order), only for applications for now

## 2.11.0 (2023-07-25)

* skip preorder step on addon creation
* add `clever addon env` command
* improve implicit ID params (owner and add-on ID / real ID) for `clever database`

## 2.10.1 (2023-02-20)

* `clever database` command
  * Improve output when trying
* `clever database backups` command
  * Improve output when there are no backups yet
  * Fix command with personal orga
  * Improve example for `database-id` option

## 2.10.0 (2023-02-16)

* add `clever database backups DATABASE-ID` command to list backups of a database
* add `clever database backups download DATABASE-ID BACKUP-IP` command to download a backup
* add `clever curl` so we can prefix any `curl` command with `clever` and benefit from the local oAuth v1 auth

## 2.10.0-beta.2 (2022-09-13)

* NetworkGroups fix wrong function call.

## 2.10.0-beta.0 (2022-09-06)

* Add NetworkGroups commands `clever ng --help`

## 2.9.1 (2022-02-28)

* Upgrade opn to open

## 2.9.0 (2022-01-12)

* Add NewRelic support in `clever drains`

## 2.8.1 (2022-01-10)

* Fix `colors` to `1.4.0`

## 2.8.0 (2021-02-09)

* Add options support for `clever addon create` (options like encryption-at-rest)
* Display available versions in `clever addon providers show <provider>`
* Display available options in `clever addon providers show <provider>`
* Fix `clever deploy` which was displaying logs from runtime instances
* Fix `clever accesslogs` so it doesn't fail when source object is undefined
* Prevent race conditions on parallel CI configs with `clever deploy` and git add remote
* Format `.clever.json` (Mickael Chanrion)

## 2.7.2 (2020-10-09)

* addon: fix create relying on default region

## 2.7.1 (2020-08-21)

* Fix linux-release-info usage in `clever diag`

## 2.7.0 (2020-08-20)

* Improve `clever deploy` perfs in several cases (partial push, force push...)
  * NOTE: Pushing a brand new repo is still slow in some situations
* Add commands for favourite domains (Julien Tanguy)
  * `clever domain` now displays a star prefix `*` before the favourite domain in the list
  * `clever domain favourite` just displays the favourite domain (no prefix)
  * `clever domain favourite set example.com` sets the favourite domain to `example.com`
  * `clever domain favourite unset` unsets the favourite domain for this app
* Add a message while waiting for deploy to start `clever deploy` and `clever restart`
* Add shallow detection with appropriate error message for `clever deploy`
* Fix `clever status` typo in output (Clément Delafargue)
* Fix `clever env` error message when JSON input is incorrect (Jean Baptiste Noblot)
* Update dependencies

This is the one with the latest isomorphic-git!!!

## 2.6.1 (2020-05-29)

* Fix `clever restart` default cache behaviour and option `--without-cache`
* Fix `clever config` docs wording (Clément Delafargue)

## 2.6.0 (2020-05-28)

* Add `--addon` option for all `clever drain` commands

## 2.5.0 (2020-05-26)

* Add `clever config` command to configure application options
  * Existing supported options: `name`, `description`, `zero-downtime`, `sticky-sessions` and `cancel-on-push`
  * New supported option: `force-https`
* Add `--follow` to `clever deploy` and `clever restart` so you can continue to follow logs after the deployment is finished
* Fix #318 where `clever deploy` and `clever restart` would sometimes never exit
   * We changed the way we detect when a deployment is finished
* Fix #304 where `clever logs` would run endlessly even when using `--before/--until`

### Internals

* We completely removed our dependency to Bacon.js, goodbye old friend 😘
* `@clevercloud/client` was updated to `6.0.0` so we can use the new event based API for logs and events

## 2.4.0 (2020-04-16)

* Add `--json` option to `clever env import` and `clever published-config import` (Clément Delafargue)

## 2.3.0 (2020-03-30)

* Add `clever tcp-redirs` command to configure TCP redirections

## 2.2.3 (2020-03-30)

- Fix `link` when app ID is not in personal space

## 2.2.2 (2020-03-28)

- Fix `login` and `logout` commands, update mkdirp usage (new version returns a promise)

## 2.2.1 (2020-03-27)

### For users

- Fix drain type autocomplete
- Always save `org_id` in `.clever.json` with `clever link`
- Add on API calls when `CLEVER_VERBOSE` is enabled

### Internals

We did a bit refactor in the codebase, less bacon, more promises and no more legacy clever-client!!

- Remove Bacon from `Interact.confirm()`
- Update @clevercloud/client to 5.0.1 (with fixed/improved function names)
- Add `getAppDetails()` in app_configuration
- Cleanup in models/addon
- Cleanup in models/application
- Cleanup in models/organisation
- Refactor `clever addon` (less Bacon, more promise)
- Refactor `clever applications` (less Bacon, more promise)
- Refactor `clever cancel-deploy` (less Bacon, more promise)
- Refactor `clever console` (less Bacon, more promise)
- Refactor `clever create` (less Bacon, more promise)
- Refactor `clever delete` (less Bacon, more promise)
- Refactor `clever deploy` and `clever restart` (less Bacon, more promise)
- Refactor `clever domain` (less Bacon, more promise)
- Refactor `clever link` (less Bacon, more promise)
- Refactor `clever logs` (less Bacon, more promise)
- Refactor `clever service` (less Bacon, more promise)
- Refactor `clever ssh` (less Bacon, more promise)
- Refactor `clever stop` (less Bacon, more promise)
- Refactor `clever unlink` (less Bacon, more promise)
- Refactor `make-default` command (less Bacon, more promise)
- Remove legacy clever-client usage with API client injection
- Remove unused `getAppData()` from app_configuration
- Use `getAppDetails()` in `clever accesslogs`
- Use `getAppDetails()` in `clever activity`
- Use `getAppDetails()` in `clever drain`
- Use `getAppDetails()` in `clever env`
- Use `getAppDetails()` in `clever open`
- Use `getAppDetails()` in `clever published-config`
- Use `getAppDetails()` in `clever scale`
- Use `getAppDetails()` in `clever status`
- Use `getAppDetails()` in notification model

## 2.2.0 (2020-03-26)

* Alias `after/before` to `since/until` in commands `logs` and `accesslogs`
* Fix `clever accesslogs` with `--before` and/or `--after` params

## 2.1.1 (2020-03-24)

* Fix `clever scale --build-flavor`

## 2.1.0 (2020-03-20)

* Add `clever accesslogs` command to get history and contiuous access logs for apps and add-ons (fix #360)
* Improve `clever notify-email` options handling and help
* Warn about node version if there is an error
* Enable small image for release via docker image

## 2.0.0 (2020-03-06)

* Enable node engines >=12 (fix #358)
* Add elixir in autocomplete (fix #359)
* Add new `clever env import-vars FOO,BAR,BAZ` command
* Handle error when the .git folder is not found (fix #357) (Sacramentix)

### ⚠️ BREAKING CHANGES

* Update @clevercloud/client to 3.0.0 (fix env-var parsing/serialization)

Be careful if you use `clever env import` with `2.0.0` with a file that was generated with an older version.

Please read [PR 18](https://github.com/CleverCloud/clever-client.js/pull/18) for more details.

## 1.6.3 (2020-03-03)

- Fix git commit display before a `clever restart` (for new empty repos)
- Fix issue when config dir does not exist
- Fix error handling (like ECONNRESET) via `@clevercloud/client@2.3.1`
- Fix some connection errors via `@clevercloud/client@2.3.1`

## 1.6.2 (2019-10-03)

- Fix git commit diplay just before a `clever deploy` (for new empty repos)

## 1.6.1 (2019-09-30)

- Fix: Look for `.git` recursively so you can `clever deploy` from subdir

## 1.6.0 (2019-09-27)

- Improve error stack in verbose mode
- Use same color display for commits in `clever restart` and `clever deploy`
- Add details about commits on `clever deploy`
- Make `clever open` default to https://fqdn
- Add `clever diag` command to get various infos to help support
- Add user id in `clever profile`

## 1.5.1 => 1.5.2

- Moving our releases to another cellar

## 1.5.0 (2019-09-02)

See previous beta releases

## 1.5.0-beta.15 (2019-08-30)

- Add `--build-flavor` to `clever scale` (Clément Delafargue)
- Add dedicated build details to `clever status`

## 1.5.0-beta.14 (2019-08-29)

* Replace superagent bintray upload with vanilla node
* Add 2XL and 3XL flavors

## 1.5.0-beta.9 => 1.5.0-beta.13

These release were only created for some tests on our CI pipeline.

## 1.5.0-beta.8 (2019-08-28)

- Rollback open module to opn (waiting for bugfix)
- Update @clevercloud/client (fix SSE)

## 1.5.0-beta.7 (2019-08-23)

- Use new @clevercloud/client auto-retry streams (logs & events)
- Fix "opn" module renamed to "open"
- Fix split error on logger

## 1.5.0-beta.6 (2019-08-02)

- Log error trace in --verbose mode
- Update deps (rename opn => open)
- Fix logs with `clever deploy` (update @clevercloud/client to 2.0.0-beta.1)
- Fix typo "connexion" => "connection" in logs and README

## 1.5.0-beta.5 (2019-08-01)

### For users

- Fix `--verbose` global param
- Docs: Add 'gitter' in webhooks format
- Fix bug with `colors` module in `clever notify-email`
- Improve some error messages in `clever webhooks` and `clever notify-email`
- `--notify` is now required for `clever notify-email`

### Internals

- Remove legacy getAuthorization
- Refactor send-to-api token loading
- Use @clevercloud/client superagent helper instead of request
- Refactor logout into promise mode
- Replace request with superagent
- Use @clevercloud/client prepareEventsWs
- Use new SSE endpoint for logs (#207)
- Use @clevercloud/client directly for GET /logs/{appId}
- Use @clevercloud/client directly in drain
- Use @clevercloud/client directly in notify-email and webhooks
- Rename functions in notify-email and webhooks
- Split notifications into notify-email and webhooks
- Ease testing for preprod with comments in config
- Update @clevercloud/client to 2.0.0-beta.0

## 1.5.0-beta.4 (2019-07-25)

- Fix --add-export option for `clever env`

## 1.5.0-beta.3 (2019-07-24)

- Update to @clevercloud/client@1.0.1 (fix for JSON requests)

## 1.5.0-beta.2 (2019-07-24)

- Rollback isomorphic-git to 0.37.0 (for now)

## 1.5.0-beta.1 (2019-07-24)

- Update @clevercloud/client (env-var util sorts variables now)
- Upgrade node version to 12

## 1.5.0-beta.0 (2019-07-23)

- Use new `@clevercloud/client` to make HTTP requests (via legacy wrapper) everywhere
- Use new `@clevercloud/client` to make HTTP requests (directly) in `env` and `published-config` commands
- Use new parsing/validation from `@clevercloud/client` in `env` and `published-config` commands
  - `clever env import` and `clever published-config import` now report detailed errors
  - `clever env set` and `clever published-config set` now report invalid name errors
  - `clever env import` and `clever published-config import` of multiline variables works!!
- Update deps
  - New `isomorphic-git` should improve `clever deploy` perfs
- Update docs about `clever env import`

## 1.4.2 (2019-05-15)

- Fix wrong auto-scalability setting in `clever status` (mpapillon)
- Fix `clever service link-app` (mpapillon)
- Update dependencies

## 1.4.1 (2019-03-28)

- Improve README.md sections about drains
- Fix errors when using `clever activity` with non TTY stdout (haitlahcen)
- Remove leftover console.log in `clever env import` (Clément Delafargue)

## 1.4.0 (2019-03-19)

- Depreciate datadog tcp drain, and remove creation of them
- Add datadog http drain

## 1.3.0 (2019-01-11)

- Fix endless wait with `clever login` on MacOS (Renan Decamps)
- Fix wrong activity display for WIP
- Always do a process.exit(0) when a command finishes properly
- Limit the number or retries for when a WebSocket connection fails

## 1.2.1 (2018-11-23)

- Fix packaging problems with exherbo, docker and homebrew

## 1.2.0 (2018-11-23)

- Add datadog drain

## 1.1.1 (2018-11-09)

- Rollback isomorphic-git to 0.37.0 (for now)
- Fix `slugify` function used to create alias from names

## 1.1.0 (2018-10-30)

- Fix bad usage of bacon.js in 1.0.2
- Add docker image and publish it at docker hub

## 1.0.2 (2018-10-19)

- Fix wrong name displayed after a login if you were already logged in as someone else

## 1.0.1 (2018-10-18)

- Fix unspecified name display as null in `clever login` and `clever profile`
- Fix open webpages on windows: use `opn` npm package instead of custom code

## 1.0.0 (2018-10-15)

### User features

- Add `clever logout` command to destroy local token/secret (Corentin Grall)
- Add `clever console` command to open the Web console on the project page (Corentin Grall)
- Add `clever version` command
- Simplify login process: users no longer need to copy/paste token and secret
- Display "clever restart --commit ..." hint when a simple restart won't do what the user wants
- Fix drain creation authorization (Sébastian Le Merdy)
- Display `[ERROR]` keyword in red when an error occurs

### CI/CD features

- Implicit login when env vars `CLEVER_TOKEN` and `CLEVER_SECRET` are present
- Exit process with status 1 when an error occurs
- Forward all error logs to stderr

### Technical improvements

- Replace [nodegit](https://github.com/nodegit/nodegit) with [isomorphic-git](https://github.com/isomorphic-git/isomorphic-git)
- Add ESLint config with a big refactoring to go along
- Always use the npm `colors` package in safe mode: no global `String` pollution
- Build, package and publish with a multibranch pipeline project on Jenkins

### Packaging & distribution

- Add a directory in tar.gz and zip archives, the clever binary is in this directory
- Publish `.rpm` and `.deb` packages (Thibaud Lepretre)
- Publish exherbo packages
- Publish chocolatey packages automatically
- Publish npm package, it's back!
- Introduce beta releases: npm, rpm, deb, archlinux, exherbo, chocolatey, homebrew...

## 0.10.1 (2018-01-16)

 - Add `clever env` to display app dependencies environment variables (fixes #165)
 - Add `clever profile` to display infos about current logged in user (name, email 2FA) (fixes #161)
 - Add `-i` option to `clever ssh` to provide identify file (fixes #164)
 - Show commit about to be redeployed (fixes #145)
 - Ignore parent ".clever.json" with `clever create` (fixes #179)
 - Normalize (slugify) alias and git remote names (fixes #166)
 - Fix logger and console (fixes #134)
 - Update to latest nodegit (and fix node version to 8.3.0)
 - Fix libss/openssl install docs (Adrien Duclos)
 - Add MacOS installation docs (Antonio Goncalves)

## 0.9.2 (2017-09-15)

 - Ignore disabled variants and only match on variants
 - Use the variant's default flavor when creating an app

## 0.9.1 (2017-09-14)

 - Fix app creation for java variants (jar, war, …)
 - Use app type default flavor instead of hardcoded "S"

## 0.9.0 (2017-08-18)

 - Provide standalone version
 - Fix premature exit in `clever deploy`
 - Fix connection issues with websocket connections
 - Display addonId upon addon creation (Philippe Charrière)
 - Add `--addon` option to `clever logs` (Alexandre Duval)
 - Logs drain management
 - Allow internal addon ids in `clever addon`
 - Fix autocompletion issue with flag names

## 0.8.3 (2017-05-30)

 - Unlink applications when deleting them (fixes #124)
 - Make `install-clever-completion` work on Mac OS (Cédric Corbière)
 - Allow non-interactive login (fixes #128)
 - Filter logs by deployment in `clever logs`
 - Only display logs for the current deployment in `clever deploy` and `clever restart`
 - Fix hanging in `clever restart` (fixes #130)

## 0.8.2 (2017-03-22)

 - Fix `clever link` for PHP-FTP applications

## 0.8.1 (2017-03-13)

 - Fix `clever login` on windows

## 0.8.0 (2017-03-06)

 - More information when creating not free addons
 - Better error message in `clever deploy` when the application is up to date
 - Use temporary git remotes when necessary (instead of failing)
 - Keyword search in `clever logs`

## 0.7.1 (2017-02-14)

 - Fix `clever ssh --alias` behaviour
 - Fix installation on windows systems

## 0.7.0 (2017-02-07)

 - Fix addon creation in the right organisation
 - Add command to delete an application
 - Handle websocket errors (logs, events)
 - Add command to SSH to an application / instance
 - Sort autocomplete results in instanceTypes
 - Add support for Node 7.x (nodegit dependency bump)
 - Drop support for Node <4

## 0.6.1 (2016-10-24)

 - Support for email notifications
 - Simplify installation (dropped dependency on node-expat)

## 0.6.0 (2016-10-06)

 - Better support for CCAPI error messages
 - Warn users using an out-of-date version
 - Favor using git over HTTPS
 - Support for webhooks

## 0.5.3 (2016-09-23)

 - Add format description for date parameters in `clever logs` (Corentin
   Cailleaud)
 - Fix `clever env import`
 - Fix `clever make-default`

## 0.5.2 (2016-07-27)

 - Fix default domain name choice in `clever open`
 - Allow to choose a specific commit in `clever restart`
 - Allow to restart an application without using cache

## 0.5.1 (2016-07-07)

 - Update readme with `0.5.0` changes
 - Update completion and documentation for new java instances
 - Fix issue with installation on ubuntu machines
 - Fix `clever scale` behaviour

## 0.5.0 (2016-06-24)

 - Node 6 support (Arnaud Lefebvre)
 - More friendly way to specify applications, organisations and addons by name
   instead of ids. The syntax `org_name/app_name` is now deprecated
   (issues #51/#67)
 - Add support for service dependencies with `clever service` and `clever
   published-config` commands (issue #55)
 - Add `--before` and `--after` flags to `clever logs` to fetch logs at a
   specific date/time (issue #49)
 - Let the user create a github-linked application (issue #64)
 - Let the user set a default application (issue #30)
 - `clever addon` commands are now relative to owners, not applications
 - Add `clever open` to open an application in the browser (issue #43)
 - Rename command `list` to `applications` (issue #31)
 - Automatically reconnect websocket when the connection is closed (Arnaud
   Lefebvre)
 - Use mocha to run tests (Arnaud Lefebvre)

## 0.4.0 (2016-01-06)

 - Add `clever restart` command to restart a running application (Clément Delafargue)
 - Add `clever scale` command to edit scalability settinsg (Benjamin Drouard)
 - Forward compatible support for new application creation API (Julien Durillon)
 - Various bug fixes / UX improvements (Clément Delafargue, Marc-Antoine Perennou)

## 0.3.4 (2015-10-15)

 - Support for node v4 (Alexandre Berthaud)
 - Support being called from a directory (Alexandre Berthaud)
 - Clean up autocompletion installation scripts (Marc-Antoine Perennou)
 - Fix environment variables definition

## 0.3.3 (2015-09-28)

 - Fix crash when pushing for the first time
 - Quit at the end of a deployment with the right exit code
 - Display more information when SSH auth fails

## 0.3.2 (2015-09-23)

 - Fix crash when config files were missing
 - More information in clever login

## 0.3.1 (2015-09-23)

 - Fix postinstall script

## 0.3.0 (2015-09-23)

 - Add color to deployment related log lines
 - Rename `log` command to `logs`
 - Return with error or success status at the end of a deployment in `clever deploy -q`
 - Import & export env variables
 - Only deploy if there is new code to push (overridable with `--redeploy`)
 - Allow to force a deployment with `--force` (à la `git push`)
 - List linked applications with `clever list`
 - Rename an addon
 - Easy autocompletion installation

## 0.2.3 (2015-08-25)

 - Autocomplete local branches in `clever deploy`
 - Add `--follow` option to `clever activity`
 - Status information in `clever deploy -q`
 - Addon support

## 0.2.2 (2015-08-12)

 - Display messages when waiting for logs
 - Better error messages when specifying an alias
 - Use provided alias when creating an application

## 0.2.1 (2015-07-28)

Apply bug fixes from dependencies

## 0.2.0 (2015-07-28)

Initial public release
