// Manual sync between the local database and the versioned content/ folder.
// Usage: npm run content:export   (database → content/*.json)
//        npm run content:import   (content/*.json → database, overwrites local content)
import { getDb } from '../src/lib/db.ts';
import { CONTENT_DIR, exportContent, importContent } from '../src/lib/sync.ts';

const action = process.argv[2];
const db = getDb();

if (action === 'export') {
  exportContent(db);
  console.log(`Contenu exporté dans ${CONTENT_DIR}`);
} else if (action === 'import') {
  if (!importContent(db)) {
    console.error(`Aucun contenu à importer dans ${CONTENT_DIR}`);
    process.exit(1);
  }
  console.log(`Contenu importé depuis ${CONTENT_DIR}`);
} else {
  console.error('Usage: node scripts/content.ts export|import');
  process.exit(1);
}
