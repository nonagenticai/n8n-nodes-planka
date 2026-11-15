# n8n-nodes-planka

[![npm version](https://img.shields.io/npm/v/@nonagenticai/n8n-nodes-planka.svg)](https://www.npmjs.com/package/@nonagenticai/n8n-nodes-planka)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/nonagenticai/n8n-nodes-planka/actions/workflows/ci.yml/badge.svg)](https://github.com/nonagenticai/n8n-nodes-planka/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/nonagenticai/n8n-nodes-planka)](https://github.com/nonagenticai/n8n-nodes-planka/releases)

An n8n community node for [Planka](https://planka.app), the open-source kanban board. It gives
n8n workflows typed access to Planka projects, boards, lists, cards and their supporting objects,
without hand-written HTTP Request nodes.

| | |
|---|---|
| **Runtime** | TypeScript / Node.js, packaged as an n8n community node |
| **Depends on** | An n8n instance and a reachable Planka instance (the bundled API spec is Planka 2.0.0) |
| **Runs on** | Inside n8n, installed from the GUI or npm |

## Features

- **22 resources**: Project, Board, List, Card, User, Task, Task List, Comment, Attachment, Label,
  Webhook, Membership, Config, Terms, Notification, Notification Service, Custom Field Group,
  Custom Field, Custom Field Value, Base Custom Field Group, Action, Project Manager.
  `Manifest` is not a node resource.
- **99 operations** across those resources (the full list is in
  [`docs/node-reference.md`](docs/node-reference.md)).
- **API coverage**: the node's requests cover 95 of the 100 operations in the bundled Planka 2.0.0
  OpenAPI spec ([`docs/openapi.json`](docs/openapi.json)); the credential flow adds two more, so 97
  of the 100 are reachable. See [API coverage](#api-coverage).
- **Authentication**: Planka email/username and password; the session token is obtained and cached
  automatically.
- **Error handling**: upstream detail is preserved and credentials are redacted from messages.
- **File uploads**: attachments on cards and avatars for users.
- **Terms acceptance**: Planka's terms acceptance flow is handled automatically during login.

## Installation

### n8n GUI (recommended)

1. Go to **Settings → Community Nodes → Install**
2. Enter `@nonagenticai/n8n-nodes-planka`
3. Restart n8n

### npm

```bash
npm install @nonagenticai/n8n-nodes-planka
```

The current npm release is **0.1.5**. Release history is in [`CHANGELOG.md`](CHANGELOG.md).

## Configuration

Create a **Planka Kanban API** credential (**Credentials → New → Planka Kanban API**):

| Field | Default | Meaning |
|---|---|---|
| **Planka Base URL** | — (required) | Base URL of your Planka instance, e.g. `https://planka.example.com` |
| **Email or Username** | — (required) | Your Planka login |
| **Password** | — (required) | Your Planka password |
| **SSL Certificate Options → Ignore SSL Issues** | `false` | Ignore SSL certificate errors; development only, for self-signed certificates |

Use **Test** to verify the credential against your instance.

## Usage

### Resources

The node exposes 22 resources. Operations common to most resources are Create, Get, Update and
Delete; the complete per-resource list, with each operation's value and description, is in
[`docs/node-reference.md`](docs/node-reference.md). Highlights:

- **Project**: create, get, list, update, delete, upload/delete background image
- **Board**: create, get, update, delete
- **List**: create, get, get by name, update, delete, move cards, sort, clear
- **Card**: create, get, get ancestor chain, update, delete, duplicate, read notifications, list in list
- **User**: create, get, list, update, delete, update avatar/email/password/username, create API key
- **Task, Task List, Comment, Label, Attachment**: create, update, delete and the resource-specific
  list/add/remove operations
- **Membership**: add/remove users on cards and boards, update board membership roles
- **Config, Terms, Notification, Notification Service, Action, Project Manager, and the custom-field
  resources**: the operations listed in the reference

### Create Project → Board → List → Card

```
1. Planka Node (Project - Create)
   → Name: "My Project"

2. Planka Node (Board - Create)
   → Project ID: {{ $json.item.id }}
   → Name: "Sprint 1"
   → Position: 0

3. Planka Node (List - Create)
   → Board ID: {{ $json.item.id }}
   → Name: "To Do"
   → Position: 0

4. Planka Node (Card - Create)
   → List ID: {{ $json.item.id }}
   → Name: "Task 1"
   → Position: 0
   → Description: "Complete feature X"
```

### Bulk create cards from a spreadsheet

```
1. Spreadsheet File Node (Read)
2. Code Node (Transform data)
3. Planka Node (Card - Create)
   → List ID: "abc123"
   → Name: {{ $json.title }}
   → Description: {{ $json.description }}
```

## API coverage

The node implements **99 operations across 22 resources**. Its requests use **95 of the 100
operations** defined by the bundled Planka 2.0.0 OpenAPI spec (70 paths). The credential flow calls
`POST /api/access-tokens` and `POST /api/access-tokens/accept-terms` automatically, so **97 of the
100** spec operations are reachable from a workflow.

The three spec operations the node does not implement are all access-token administration:

- `DELETE /access-tokens/me`
- `POST /access-tokens/exchange-with-oidc`
- `POST /access-tokens/revoke-pending-token`

Some node operations are convenience operations built from spec endpoints (for example
**List → Get by Name** and **Card → Get Ancestor Chain**), and two endpoints the node uses are not
in the 2.0.0 spec: `GET /api/task-lists/{id}/tasks` and
`GET /api/base-custom-field-groups/{id}/custom-fields`.

### Operations by resource

| Resource | Operations | Operation names |
|---|---:|---|
| Project | 7 | Create, Get, List, Update, Delete, Upload Background Image, Delete Background Image |
| Board | 4 | Create, Get, Update, Delete |
| List | 8 | Create, Get, Get by Name, Update, Delete, Move Cards, Sort, Clear |
| Card | 8 | Create, Get, Get Ancestor Chain, Update, Delete, Duplicate, Read Notifications, List In List |
| User | 10 | Create, Get, List, Update, Delete, Update Avatar, Update Email, Update Password, Update Username, Create API Key |
| Task | 4 | Create, Update, Delete, List |
| Task List | 4 | Create, Get, Update, Delete |
| Comment | 4 | Create, Update, Delete, List |
| Attachment | 3 | Create, Update, Delete |
| Label | 5 | Create, Update, Delete, Add To Card, Remove From Card |
| Webhook | 4 | Create, List, Update, Delete |
| Membership | 5 | Add User to Card, Remove User from Card, Add User to Board, Remove User from Board, Update Board Membership |
| Config | 4 | Get, Get Bootstrap, Update, Test SMTP |
| Terms | 1 | Get |
| Notification | 4 | List, Get, Update, Mark All Read |
| Notification Service | 5 | Create Board Service, Create User Service, Update, Delete, Test |
| Custom Field Group | 5 | Create Board Group, Create Card Group, Get, Update, Delete |
| Custom Field | 5 | Create in Base Group, Create in Group, Update, Delete, List in Base Group |
| Custom Field Value | 2 | Set Value, Delete Value |
| Base Custom Field Group | 3 | Create, Update, Delete |
| Action | 2 | Get Board Actions, Get Card Actions |
| Project Manager | 2 | Add, Remove |
| **TOTAL** | **99** | |

## Network configuration

### Docker considerations

- Use a hostname (`planka.example.com`) rather than `localhost`, so the n8n container can resolve
  the Planka instance.
- Make sure n8n can resolve any internal or `.local` domains you use.
- Handle self-signed certificates through the credential's **Ignore SSL Issues** option.

### Test connectivity

```bash
# From the host: obtain a session token directly from Planka
curl http://planka.example.com:3333/api/access-tokens -X POST \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test","password":"test"}'
```

## Troubleshooting

### Node doesn't appear in n8n

```bash
npm run build
ls -la dist/
n8n start --log-level=debug
```

### Authentication fails

- Verify the Planka base URL.
- Check the email/username and password.
- Make sure the Planka user can reach the instance's API.
- Test the API directly with the `curl` command above.

### API connection timeout

- Use a hostname, not `localhost`, when n8n runs in Docker.
- Check network connectivity from the n8n container to Planka.
- Verify the Planka service is running.

## Development

### Project structure

```
n8n-nodes-planka/ (package: @nonagenticai/n8n-nodes-planka)
├── nodes/Planka/
│   ├── Planka.node.ts              # Main node
│   ├── operations/                 # Operation modules
│   ├── descriptions/               # Property descriptions
│   └── helpers/                    # Node-specific helpers
├── credentials/
│   └── PlankaApi.credentials.ts    # Credentials
├── helpers/                         # Shared request and error helpers
├── docs/                            # Generated API reference
├── tests/                           # Unit tests
└── package.json
```

### Build and test

```bash
npm ci --registry=https://registry.npmjs.org/
npm run build          # Compile TypeScript and copy icons
npm run dev            # Watch mode
npm run lint           # ESLint
npm test               # Unit tests (integration tests excluded)
npm run test:coverage  # Unit tests with coverage
npm run docs           # Regenerate docs/node-reference.{json,md}
```

The test suite lives in `tests/unit/`. `docs/node-reference.json` and
`docs/node-reference.md` are generated from the node definition by `npm run docs`; do not edit
them by hand.

## Security

Report vulnerabilities privately through the repository's Security tab — see
[`SECURITY.md`](SECURITY.md). Do not open a public issue for a security problem.

## Contributing

Issues and pull requests are welcome. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the development
setup, test and lint commands, branch and commit conventions, and the pull-request process.
Commits carry DCO sign-off (`git commit -s`).

## Licensing

The code in this repository is Apache-2.0 and needs no licence key to build, test or run.
It contains no licence-enforcement code: the Apache-2.0 licence in [`LICENSE`](LICENSE) is the
only licence that applies, and no licence server is involved.

## License

Apache-2.0 — see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).

## Support

- Issues: [GitHub Issues](https://github.com/nonagenticai/n8n-nodes-planka/issues)
- Documentation: [docs/node-reference.md](./docs/node-reference.md)
- n8n Community: [community.n8n.io](https://community.n8n.io)

## Acknowledgments

- Planka project: https://planka.app
