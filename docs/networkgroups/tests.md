# Networkgroups CLI tests

This document is a list of manual integration tests for the networkgroup-related commands.

For each command, an example output is commented right under.

To improve readability, and to avoid errors, every option value is written inside quotes.

## Setup

> In the following commands, `cleverr` refers to the local `clever-tools`.
>
> Tip: Add `alias cleverr=~/path/to/clever-tools/bin/clever.js` to your `.bashprofile`, `.zprofile` or whatever.

First, let's define variables to facilitate command line calls.

```sh
# Valid cases
ngLabel='temp-test'
testAppId='app_b888f06d-3adb-4cf1-b017-7eac4f096e90'
memberId1='my-member-1'
memberId2='my-member-2'
peerLabel1='my-peer-1'
peerLabel2='my-peer-2'
publicKey1='<pub_key_1>'
publicKey2='<pub_key_2>'

# Invalid cases
ngLabelForInvalidCases1='test-1'
ngLabelForInvalidCases2='test-2'
```

## Tests

### Valid cases

#### Create a networkgroup

1. Setup

   ```sh
   cleverr ng create --label "$ngLabel" --description '[Test] Create a networkgroup'
   # Networkgroup 'test-dev' was created with the id 'ng_cdf5cc11-4fdf-47cf-8d82-5b89f722450a'.
   ```

2. Test

   ```sh
   cleverr ng list
   # Networkgroup ID                           Label                 Members  Peers  Description
   # ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   # ng_cdf5cc11-4fdf-47cf-8d82-5b89f722450a   test-dev              0        0      [Test] Create a networkgroup.
   ```

3. Tear down

   ```sh
   cleverr ng delete --ng "$ngLabel"
   # Networkgroup 'ng_cdf5cc11-4fdf-47cf-8d82-5b89f722450a' was successfully deleted.
   ```

#### Delete a networkgroup

1. Setup

   ```sh
   cleverr ng create --label "$ngLabel" --description '[Test] Delete a networkgroup'
   # Networkgroup 'test-dev' was created with the id 'ng_cdf5cc11-4fdf-47cf-8d82-5b89f722450a'.
   cleverr ng delete --ng "$ngLabel"
   # Networkgroup 'ng_cdf5cc11-4fdf-47cf-8d82-5b89f722450a' was successfully deleted.
   ```

2. Test

   ```sh
   cleverr ng list
   # No networkgroup found.
   ```

#### Add a member

1. Setup

   ```sh
   cleverr ng create --label "$ngLabel" --description '[Test] Add a member'
   # Networkgroup 'test-dev' was created with the id 'ng_cdf5cc11-4fdf-47cf-8d82-5b89f722450a'.
   ```

2. Test

   ```sh
   cleverr ng --ng "$ngLabel" members list
   # No member found
   cleverr ng --ng "$ngLabel" members add --member-id "$testAppId" --type 'application' --domain-name 'api-tester' --label '[Test] API Tester'
   # Successfully added member 'app_b888f06d-3adb-4cf1-b017-7eac4f096e90' to networkgroup 'ng_cdf5cc11-4fdf-47cf-8d82-5b89f722450a'.
   cleverr ng --ng "$ngLabel" members list
   # Member ID                                 Member Type                Label                                     Domain Name
   # ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   # app_b888f06d-3adb-4cf1-b017-7eac4f096e90  application                [Test] API Tester                         api-tester
   ```

3. Tear down

   ```sh
   cleverr ng delete --ng "$ngLabel"
   # Networkgroup 'ng_cdf5cc11-4fdf-47cf-8d82-5b89f722450a' was successfully deleted.
   ```

#### Add an external peer

1. Setup

   ```sh
   cleverr ng create --label "$ngLabel" --description '[Test] Add an external peer'
   # Networkgroup 'temp-test' was created with the id 'ng_84c65dce-4a48-4858-b327-83bddf5f0a79'.
   cleverr ng --ng "$ngLabel" members add --member-id "$memberId1" --type 'external' --domain-name 'my-nodes-category' --label '[Test] My external nodes category'
   # Successfully added member 'my-member-1' to networkgroup 'ng_84c65dce-4a48-4858-b327-83bddf5f0a79'.
   ```

2. Test

   ```sh
   cleverr ng --ng "$ngLabel" peers list
   # No peer found. You can add an external one with `clever networkgroups peers add-external`.
   cleverr ng --ng "$ngLabel" peers add-external --role 'client' --public-key "$publicKey1" --label "$peerLabel1" --parent "$memberId1"
   # External peer (auto id) must have been added to networkgroup 'ng_84c65dce-4a48-4858-b327-83bddf5f0a79'.
   cleverr ng --ng "$ngLabel" peers list
   # Peer ID                                        Peer Type                  Endpoint Type              Label                                          Hostname              IP Address
   # ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   # external_3b3e82e2-e656-450b-8cc7-b7498d0134f4  ExternalPeer               ClientEndpoint             my-peer-1                                      my-peer-1             10.105.0.5
   ```

3. Tear down

   ```sh
   cleverr ng delete --ng "$ngLabel"
   # Networkgroup 'ng_84c65dce-4a48-4858-b327-83bddf5f0a79' was successfully deleted.
   ```

#### WireGuard configuration updates when adding a peer

1. Setup

   ```sh
   cleverr ng create --label "$ngLabel" --description '[Test] WireGuard configuration updates when adding a peer'
   # Networkgroup 'temp-test' was created with the id 'ng_620b3482-f286-4189-9931-a8910f2ea706'.
   cleverr ng --ng "$ngLabel" members add --member-id "$memberId1" --type 'external' --domain-name 'my-nodes-category' --label '[Test] My external nodes category'
   # Successfully added member 'my-member-1' to networkgroup 'ng_620b3482-f286-4189-9931-a8910f2ea706'.
   cleverr ng --ng "$ngLabel" peers add-external --role 'client' --public-key "$publicKey1" --label "$peerLabel1" --parent "$memberId1"
   # External peer (auto id) must have been added to networkgroup 'ng_620b3482-f286-4189-9931-a8910f2ea706'.
   cleverr ng --ng "$ngLabel" peers list
   # Peer ID                                        Peer Type                  Endpoint Type              Label                                          Hostname              IP Address
   # ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   # external_3056ea93-c10d-4175-a91d-b6ed2803ce7c  ExternalPeer               ClientEndpoint             my-peer-1                                      my-peer-1             10.105.0.5
   peerId='external_3056ea93-c10d-4175-a91d-b6ed2803ce7c'
   ```

2. Test

   Call this endpoint:

   ```http
   GET /organisations/:ownerId/networkgroups/:ngId/peers/:peerId/wireguard/configuration
   ```

   You should have something like:

   ```text
   "CgpbSW50ZXJmYWNlXQpQcml2YXRlS2V5ID0gPCVQcml2YXRlS2V5JT4KQWRkcmVzcyA9IDEwLjEwNS4wLjUvMTYKCgoKCgo="
   ```

   ```sh
   cleverr ng --ng "$ngLabel" peers add-external --role 'client' --public-key "$publicKey2" --label "$peerLabel2" --parent "$memberId1"
   # External peer (auto id) must have been added to networkgroup 'ng_620b3482-f286-4189-9931-a8910f2ea706'.
   ```

   Call this endpoint again:

   ```http
   GET /organisations/:ownerId/networkgroups/:ngId/peers/:peerId/wireguard/configuration
   ```

   You should have something like:

   ```text
   "CgpbSW50ZXJmYWNlXQpQcml2YXRlS2V5ID0gPCVQcml2YXRlS2V5JT4KQWRkcmVzcyA9IDEwLjEwNS4wLjUvMTYKCgoKCltQZWVyXQogICAgUHVibGljS2V5ID0gPHB1Yl9rZXlfMj4KICAgIEFsbG93ZWRJUHMgPSAxMC4xMDUuMC42LzMyCiAgICBQZXJzaXN0ZW50S2VlcGFsaXZlID0gMjUKCgoK"
   ```

3. Tear down

   ```sh
   cleverr ng delete --ng "$ngLabel"
   # Networkgroup 'ng_620b3482-f286-4189-9931-a8910f2ea706' was successfully deleted.
   ```

### Invalid cases

#### Create two networkgroups with same label

1. Setup

   ```sh
   cleverr ng create --label "$ngLabel" --description '[Test] Create two networkgroups with same label'
   # Networkgroup 'temp-test' was created with the id 'ng_ebee26cf-f1dc-464c-8359-d3a924a3fd97'.
   ```

2. Test

   ```sh
   cleverr ng create --label "$ngLabel" --description '[Test] Should not be created'
   # [ERROR] Error from API: 409 Conflict
   ```

3. Tear down

   ```sh
   cleverr ng delete --ng "$ngLabel"
   # Networkgroup 'ng_ebee26cf-f1dc-464c-8359-d3a924a3fd97' was successfully deleted.
   ```

#### Add invalid member

> ⚠️ Does not work actually
> TODO: Create issue

1. Setup

   ```sh
   cleverr ng create --label "$ngLabel" --description '[Test] Add invalid member'
   # Networkgroup 'temp-test' was created with the id 'ng_df116d7b-47f3-469b-bee7-ae5792ff92c4'.
   ```

2. Test

   ```sh
   cleverr ng --ng "$ngLabel" members add --member-id '<invalid_id>' --type 'external' --domain-name 'invalid'
   # [ERROR] Error from API: 404 Not Found
   ```

3. Tear down

   ```sh
   cleverr ng delete --ng "$ngLabel"
   # Networkgroup 'ng_df116d7b-47f3-469b-bee7-ae5792ff92c4' was successfully deleted.
   ```

#### Add peer with invalid parent

1. Setup

   ```sh
   cleverr ng create --label "$ngLabelForInvalidCases1" --description '[Test] Networkgroup 1'
   # Networkgroup 'test-1' was created with the id 'ng_cdf5cc11-4fdf-47cf-8d82-5b89f722450a'.
   cleverr ng create --label "$ngLabelForInvalidCases2" --description '[Test] Networkgroup 2'
   # Networkgroup 'test-2' was created with the id 'ng_c977973a-42ce-4f67-b906-4ffc2dcb250c'.
   cleverr ng --ng "$ngLabelForInvalidCases2" members add --member-id "$memberId1" --type 'external' --domain-name 'member-2' --label '[Test] Member in other networkgroup'
   # Successfully added member 'app_b888f06d-3adb-4cf1-b017-7eac4f096e90' to networkgroup 'ng_c977973a-42ce-4f67-b906-4ffc2dcb250c'.
   ```

2. Test

   - Invalid parent `id`

     ```sh
     cleverr ng --ng "$ngLabelForInvalidCases1" peers add-external --role 'client' --public-key "$publicKey1" --label '[Test] Invalid parent' --parent 'invalid_id'
     # [ERROR] Error from API: 404 Not Found
     ```

   - Parent in another networkgroup

     ```sh
     cleverr ng --ng "$ngLabelForInvalidCases1" peers add-external --role 'client' --public-key "$publicKey1" --label '[Test] Parent in other networkgroup' --parent "$memberId1"
     # [ERROR] Error from API: 404 Not Found
     ```

3. Tear down

   ```sh
   cleverr ng delete --ng "$ngLabelForInvalidCases1"
   # Networkgroup 'ng_cdf5cc11-4fdf-47cf-8d82-5b89f722450a' was successfully deleted.
   cleverr ng delete --ng "$ngLabelForInvalidCases2"
   # Networkgroup 'ng_c977973a-42ce-4f67-b906-4ffc2dcb250c' was successfully deleted.
   ```

### Edge cases

#### Create networkgroup after delete

1. Setup

   ```sh
   cleverr ng create --label "$ngLabel" --description '[Test] Should be deleted'
   # Networkgroup 'temp-test' was created with the id 'ng_811d29f5-2d15-44a6-8f73-d16dee8f6316'.
   cleverr ng delete --ng "$ngLabel"
   # Networkgroup 'ng_811d29f5-2d15-44a6-8f73-d16dee8f6316' was successfully deleted.
   ```

2. Test

   ```sh
   cleverr ng create --label "$ngLabel" --description '[Test] Create networkgroup after delete'
   # Networkgroup 'temp-test' was created with the id 'ng_4e2d4e0e-9a47-4cb7-95a4-d85355b1ccb3'.
   ```

3. Tear down

   ```sh
   cleverr ng delete --ng "$ngLabel"
   # Networkgroup 'ng_4e2d4e0e-9a47-4cb7-95a4-d85355b1ccb3' was successfully deleted.
   ```
