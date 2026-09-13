#!/usr/bin/env python3
"""Build the public, data-free manifest for one coherent MAX-G UI release."""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

def build():
    worker = (ROOT / 'sw.js').read_text()
    version = re.search(r"const RELEASE_VERSION = '([^']+)'", worker)[1]
    build_number = int(re.search(r'const RELEASE_BUILD = (\d+)', worker)[1])
    module = (ROOT / 'release-version.js').read_text()
    package = json.loads((ROOT / 'package.json').read_text())
    if f"RELEASE_VERSION = '{version}'" not in module or f'RELEASE_BUILD = {build_number}' not in module or package['version'] != version:
        raise ValueError('Shared release versions must match before publishing.')
    shell = re.search(r'const SHELL_FILES = \[(.*?)\];', worker, re.S)[1]
    names = {name[2:] or 'index.html' for name in re.findall(r"'(\./[^']*)'", shell)}
    names.update({'sw.js', 'package.json', 'IOS-INSTALL.md', 'DEVICE-GUIDE.md', 'README.md', 'WEATHER-GUIDE.md', 'VOICE-SETUP.md'})
    files = []
    for name in sorted(names):
        path = ROOT / name
        if not path.is_file() or path.is_symlink() or not path.resolve().is_relative_to(ROOT.resolve()):
            raise ValueError('Missing or invalid release file: ' + name)
        data = path.read_bytes()
        files.append({'path': name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
    release = {'schema': 1, 'version': version, 'build': build_number, 'min_companion_build': 205, 'files': files}
    (ROOT / 'release.json').write_text(json.dumps(release, indent=2) + '\n')
    print(json.dumps({'version': version, 'build': build_number, 'files': len(files), 'bytes': sum(item['bytes'] for item in files)}))

if __name__ == '__main__':
    build()
