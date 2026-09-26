import hashlib, importlib.util, json, tempfile, unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('cleanup', Path(__file__).with_name('clean-app-releases.py'))
cleanup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cleanup)

class RetentionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        (self.root / 'apps').mkdir()
        self.records = []
        for version in (3, 2, 1):
            path = f'downloads/releases/demo/windows/v{version}.exe'
            target = self.root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(f'fixture {version}'.encode())
            self.records.append(dict(app='demo', platform='windows', path=path, sha256=hashlib.sha256(target.read_bytes()).hexdigest()))
        self.apps = []
        self.save()
    def save(self):
        (self.root/'apps/release-history.json').write_text(json.dumps({'releases':self.records}))
        (self.root/'apps/catalog.json').write_text(json.dumps({'apps':self.apps}))
    def test_only_third_release(self):
        self.assertEqual(cleanup.plan(self.root), [self.root/self.records[2]['path']])
        self.assertTrue((self.root/self.records[2]['path']).exists())
    def test_linked_older_release_is_kept(self):
        self.apps=[{'windows':'/'+self.records[2]['path']}];self.save()
        self.assertEqual(cleanup.plan(self.root), [])
    def test_catalog_release_link_kept(self):
        (self.root/'apps/catalog.json').write_text(json.dumps([{'downloads':{'windows':{'file':'v1.exe'}}}]))
        self.assertEqual(cleanup.plan(self.root), [])
    def test_modified_artifact_refused(self):
        (self.root/self.records[2]['path']).write_text('changed')
        with self.assertRaises(ValueError): cleanup.plan(self.root)
    def test_symlink_refused(self):
        p=self.root/self.records[2]['path'];p.unlink();p.symlink_to(self.root/self.records[0]['path'])
        with self.assertRaises(ValueError): cleanup.plan(self.root)
    def test_path_traversal_refused(self):
        self.records[2]['path']='downloads/releases/../../private.txt';self.save()
        with self.assertRaises(ValueError): cleanup.plan(self.root)
    def test_unknown_files_and_legacy_retained(self):
        (self.root/'downloads/releases/private.txt').write_text('keep')
        self.records[2]['path']='downloads/legacy.exe';self.save()
        self.assertEqual(cleanup.plan(self.root), [])
        self.assertTrue((self.root/'downloads/releases/private.txt').exists())
    def test_duplicate_refused(self):
        self.records.append(self.records[0]);self.save()
        with self.assertRaises(ValueError): cleanup.plan(self.root)
    def test_apply_removes_only_oldest_fixture(self):
        import subprocess, sys
        subprocess.run([sys.executable, str(Path(__file__).with_name('clean-app-releases.py')), '--root', str(self.root), '--apply'], check=True, capture_output=True)
        self.assertFalse((self.root/self.records[2]['path']).exists())
        self.assertTrue(all((self.root/r['path']).exists() for r in self.records[:2]))

if __name__ == '__main__': unittest.main()
