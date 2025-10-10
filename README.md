# Erwan Rivet - Portfolio

Portfolio personnel d'Erwan Rivet, développeur web spécialisé en PHP, Laravel, WordPress et technologies modernes.

## 🚀 Déploiement

Ce site est un site statique simple (HTML, CSS, JavaScript) qui peut être déployé de plusieurs façons.

### Option 1 : GitHub Pages (Recommandé)

GitHub Pages est la solution la plus simple pour déployer ce site automatiquement.

#### Configuration initiale :

1. Allez dans les paramètres du repository : `Settings` → `Pages`
2. Dans la section "Source", sélectionnez :
   - **Source** : `Deploy from a branch`
   - **Branch** : `main` (ou votre branche principale)
   - **Folder** : `/ (root)`
3. Cliquez sur `Save`

Votre site sera automatiquement déployé à l'adresse : `https://waner1er.github.io/erwan-rivet/`

#### Pour redéployer :

**C'est automatique !** Chaque fois que vous faites un `git push` sur la branche principale, GitHub Pages redéploie automatiquement le site en quelques minutes.

```bash
git add .
git commit -m "Mise à jour du site"
git push origin main
```

Attendez 2-3 minutes et votre site sera mis à jour.

### Option 2 : Déploiement manuel sur un hébergeur

Si vous utilisez un autre hébergeur (OVH, Hostinger, etc.) :

1. Connectez-vous à votre hébergeur via FTP/SFTP
2. Uploadez tous les fichiers du repository dans le dossier `public_html` ou `www`
3. Assurez-vous que `index.html` est à la racine

#### Pour redéployer manuellement :

```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Uploader les fichiers modifiés via FTP/SFTP vers votre hébergeur
```

### Option 3 : Avec GitHub Actions (Déploiement automatisé avancé)

Pour un déploiement automatique avec GitHub Actions, consultez le fichier `.github/workflows/deploy.yml` si vous en avez besoin.

## 📁 Structure du projet

```
.
├── index.html          # Page principale
├── assets/
│   ├── style.css      # Styles personnalisés
│   └── images/        # Images du site
└── README.md          # Ce fichier
```

## 🛠️ Développement local

Pour tester le site localement :

1. Clonez le repository :
```bash
git clone https://github.com/waner1er/erwan-rivet.git
cd erwan-rivet
```

2. Ouvrez `index.html` directement dans votre navigateur ou utilisez un serveur local :

```bash
# Avec Python 3
python -m http.server 8000

# Avec Node.js (npx)
npx http-server

# Avec PHP
php -S localhost:8000
```

3. Visitez `http://localhost:8000` dans votre navigateur

## 📝 Modification du contenu

- **Textes** : Modifiez directement dans `index.html`
- **Styles** : Modifiez `assets/style.css`
- **Images** : Placez vos images dans `assets/images/`

## 📧 Contact

Erwan Rivet - [riveterwan8@gmail.com](mailto:riveterwan8@gmail.com)
