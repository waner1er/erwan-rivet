# Guide de Déploiement - GitHub Pages

## 📋 Ce qui a été configuré

✅ Workflow GitHub Actions créé (`.github/workflows/deploy.yml`)
✅ Fichier `.gitignore` ajouté pour exclure les fichiers IDE
✅ README.md mis à jour avec les instructions de déploiement

## 🚀 Étapes pour activer le déploiement

### 1. Fusionner la Pull Request
Fusionnez cette Pull Request dans la branche `main` pour activer le workflow de déploiement.

### 2. Activer GitHub Pages dans les paramètres du dépôt

1. Allez dans les **Settings** (Paramètres) de votre dépôt GitHub
2. Dans le menu de gauche, cliquez sur **Pages**
3. Sous "Build and deployment", pour **Source**, sélectionnez **GitHub Actions**
   - C'est tout ! Vous n'avez pas besoin de sélectionner une branche spécifique
4. Sauvegardez les modifications

### 3. Déclenchement automatique

Une fois que vous avez fusionné la PR et activé GitHub Pages :
- Le workflow se déclenchera automatiquement
- Vous pouvez suivre la progression dans l'onglet **Actions** du dépôt
- Une fois terminé, votre site sera accessible à : `https://waner1er.github.io/erwan-rivet/`

### 4. Déploiements futurs

Chaque fois que vous pushez des modifications sur la branche `main`, le site sera automatiquement redéployé.

## 🔧 Workflow créé

Le workflow GitHub Actions :
- Se déclenche à chaque push sur `main`
- Peut aussi être déclenché manuellement via l'interface GitHub
- Utilise les actions officielles de GitHub pour le déploiement
- Déploie tout le contenu du dépôt (index.html, assets/, etc.)

## 📝 Permissions requises

Le workflow a besoin des permissions suivantes (déjà configurées) :
- `contents: read` - Pour lire le contenu du dépôt
- `pages: write` - Pour écrire sur GitHub Pages
- `id-token: write` - Pour l'authentification

## ✅ Vérification

Après le déploiement, vérifiez que :
1. Le workflow dans l'onglet Actions est passé avec succès (badge vert)
2. Votre site est accessible à l'URL GitHub Pages
3. Tous les assets (CSS, images) se chargent correctement

## 🆘 Dépannage

Si le déploiement échoue :
- Vérifiez les logs dans l'onglet **Actions**
- Assurez-vous que GitHub Pages est bien activé dans les paramètres
- Vérifiez que les permissions du workflow sont correctes
- Assurez-vous que tous les fichiers (index.html, assets/) sont présents dans le dépôt

## 📞 Support

Pour toute question, consultez :
- [Documentation GitHub Pages](https://docs.github.com/en/pages)
- [Documentation GitHub Actions](https://docs.github.com/en/actions)
