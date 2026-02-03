/**
 * Script de création du compte admin — SF Formation
 *
 * 1. Modifier USERNAME et PASSWORD ci-dessous (ou les passer en arguments)
 * 2. Exécuter : node scripts/create-admin.js
 * 3. Copier la requête SQL affichée et l'exécuter dans Supabase (SQL Editor)
 */

const bcrypt = require('bcryptjs');

// À modifier : identifiant et mot de passe du compte admin
const USERNAME = 'admin';
const PASSWORD = 'ChangeMe123!';

const username = process.argv[2] || USERNAME;
const password = process.argv[3] || PASSWORD;

const hash = bcrypt.hashSync(password, 10);

console.log('--- Hash bcrypt généré ---');
console.log(hash);
console.log('');
console.log('--- Requête SQL à exécuter dans Supabase (SQL Editor) ---');
console.log(`
INSERT INTO users (username, password_hash, role, first_login_done)
VALUES (
  '${username.replace(/'/g, "''")}',
  '${hash}',
  'admin',
  true
);
`);
console.log('--- Fin ---');
