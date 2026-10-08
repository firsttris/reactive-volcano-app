# Contributing

Thanks for helping! Bug reports, device feedback, translations and pull requests are all welcome.

## Reporting bugs

Open an [issue](https://github.com/firsttris/reactive-volcano-app/issues) and include:

- the device model and firmware version (*Settings → Device info*),
- browser and version, operating system,
- steps to reproduce, what you expected, what happened,
- the browser console output if there is an error ([how on Android](docs/development.md#debugging-on-android)).

Connection problems: please work through [Troubleshooting](docs/troubleshooting.md) first and say which
step failed.

Security issues: please report privately, see [Privacy & security](docs/privacy-security.md#reporting-a-vulnerability).

## Pull requests

1. Fork, create a branch, make your change. Keep one topic per pull request.
2. Follow the [conventions](docs/development.md#conventions): strict TypeScript, pure protocol code with
   tests, every GATT call through the queue, all UI text in `messages/en.json` and `messages/de.json`.
3. Run the checks:

   ```bash
   npm run typecheck && npm run lint && npm test && npm run test:e2e
   ```

4. Update the docs if behaviour changed: [Usage](docs/usage.md), the feature tables in `README.md` and
   `README_de.md`, [Bluetooth protocol](docs/protocol.md) for byte-level changes, screenshots with
   `npm run screenshots` for visible UI changes.
5. Describe what changed and why, and on which real device you tested it, if any.

## Protocol work

Only use information you are entitled to use: what you observe from your own device's Bluetooth
interface. Do not copy code, assets or texts from the manufacturer's or other third-party software into
this repository. See the [legal notice](docs/legal.md).

## License

By contributing you agree that your contribution is licensed under the project's
[AGPL-3.0](LICENSE) license (see [NOTICE](NOTICE)).
