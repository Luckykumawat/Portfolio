"""Stage runtime files for Pages; original artwork sources stay in Git only."""
import json
import os
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
output = root / '_site'
if output.exists():
    shutil.rmtree(output)
output.mkdir()
for pattern in ('*.html', '*.css', '*.js', '*.mjs', '*.ico', '*.md'):
    for source in root.glob(pattern):
        shutil.copy2(source, output / source.name)
for name in ('admin', 'cms', 'data', 'image', 'mascots', 'supabase'):
    shutil.copytree(root / name, output / name)
for required in ('index.html', 'admin/index.html', 'cms/config.mjs',
                 'cms/vendor/supabase.mjs', 'mascots.html'):
    if not (output / required).is_file():
        raise RuntimeError(f'Missing website file: {required}')
(output / '.nojekyll').touch()
(output / 'deploy-version.json').write_text(json.dumps({
    'commit': os.environ.get('GITHUB_SHA', 'local-preview')
}) + '\n')
files = list(output.rglob('*'))
print(f'Staged {sum(p.is_file() for p in files)} files, '
      f'{sum(p.stat().st_size for p in files if p.is_file()) / 1024**2:.1f} MiB')
