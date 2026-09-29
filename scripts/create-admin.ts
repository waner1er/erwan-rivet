// Creates a back-office user, or resets the password of an existing one.
// Usage: node scripts/create-admin.ts <email> <password> [name]
import { get } from '../src/lib/db.ts';
import { createUser, updatePassword } from '../src/lib/auth.ts';

const [email, password, name = 'Erwan RIVET'] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: npm run admin:create -- <email> <mot-de-passe> [nom]');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Le mot de passe doit faire au moins 12 caractères.');
  process.exit(1);
}

const existing = get<{ id: number }>('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
if (existing) {
  updatePassword(existing.id, password);
  console.log(`Mot de passe mis à jour pour ${email}.`);
} else {
  createUser(email, name, password);
  console.log(`Administrateur ${email} créé.`);
}
