"""Prune only hash-verified, registered obsolete release artifacts. Dry run by default."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath

def plan(root):
    root = Path(root).resolve()
    inventory = json.loads((root / 'apps/release-history.json').read_text())
    catalog = json.loads((root / 'apps/catalog.json').read_text())
    apps = catalog if isinstance(catalog, list) else catalog['apps']
    linked = {a.get(p, '').lstrip('/') for a in apps for p in ('android', 'ios', 'windows')}
    linked_names = {PurePosixPath(d['file']).name for a in apps for d in a.get('downloads', {}).values()}
    groups, seen = {}, set()
    # Records are newest first within each app/platform. Keep at least two.
    for record in inventory['releases']:
        path = record['path']
        parts = PurePosixPath(path).parts
        if path in seen or not parts or '..' in parts or path.startswith('/'):
            raise ValueError('Invalid or duplicate release path')
        seen.add(path)
        groups.setdefault((record['app'], record['platform']), []).append(record)
    candidates = []
    for records in groups.values():
        for record in records[2:]:
            path = record['path']
            if path in linked or PurePosixPath(path).name in linked_names or not path.startswith('downloads/releases/'):
                continue
            target = root / path
            if not target.exists() and not target.is_symlink():
                continue
            if any(parent.is_symlink() for parent in [target, *target.parents] if parent != root):
                raise ValueError('Refusing a symlink in a release path')
            if not target.resolve().is_relative_to(root / 'downloads/releases') or not target.is_file():
                raise ValueError('Release path is not a managed file')
            if hashlib.sha256(target.read_bytes()).hexdigest() != record['sha256']:
                raise ValueError('Release hash changed; refusing cleanup')
            candidates.append(target)
    return candidates

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--apply', action='store_true', help='Delete only the validated obsolete artifacts in the plan')
    args = parser.parse_args()
    candidates = plan(args.root)  # Validate the entire plan before the first deletion.
    for path in candidates:
        print(('DELETE ' if args.apply else 'WOULD DELETE ') + str(path.relative_to(args.root.resolve())))
    if args.apply:
        for path in candidates:
            path.unlink()
    print(f'{len(candidates)} obsolete artifact(s); current, previous, unregistered files and user data retained.')
