"""Links from docs/ into the rest of the repository point to GitHub on the website.

The Markdown links `../README.md`, `../Dockerfile` or `../.github/workflows/build.yml`
work on GitHub, but those files are not part of the documentation, so MkDocs
cannot serve them (and `--strict` would fail). This hook turns them into links
to the file on GitHub while the page is built; the Markdown itself stays as is.
"""

import re

from mkdocs.config.defaults import MkDocsConfig
from mkdocs.structure.files import Files
from mkdocs.structure.pages import Page

# `](../path)` and `](../path#anchor)`, but not `](../../...)` or absolute URLs
_LINK = re.compile(r"\]\(\.\./(?!\.\./)([^)#\s]+)(#[^)\s]*)?\)")


def on_page_markdown(markdown: str, page: Page, config: MkDocsConfig, files: Files) -> str:
    repo_url = config.repo_url.rstrip("/")

    def to_github(match: re.Match) -> str:
        path, anchor = match.group(1), match.group(2) or ""
        return f"]({repo_url}/blob/main/{path}{anchor})"

    return _LINK.sub(to_github, markdown)
