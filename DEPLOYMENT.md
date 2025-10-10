# Guide de Déploiement - Erwan Rivet Portfolio

## 🎯 Question : "Si je souhaite redéployer, il faut faire quoi ?"

### Réponse Rapide

**Pour redéployer votre site, il suffit de faire :**

```bash
git add .
git commit -m "Mise à jour du site"
git push origin main
```

Le site sera automatiquement redéployé sur GitHub Pages en 2-3 minutes ! ✅

---

## 📋 Méthodes de Déploiement

### 1️⃣ GitHub Pages (AUTOMATIQUE) - Recommandé

**Avantages :**
- ✅ Déploiement automatique à chaque push
- ✅ Gratuit et illimité
- ✅ HTTPS automatique
- ✅ Aucune configuration serveur nécessaire

**Configuration (à faire une seule fois) :**

1. Allez sur : https://github.com/waner1er/erwan-rivet/settings/pages
2. Configurez :
   - **Source** : `Deploy from a branch`
   - **Branch** : `main`
   - **Folder** : `/ (root)`
3. Cliquez sur **Save**

**Pour redéployer :**

Simplement poussez vos modifications :

```bash
# Modifiez vos fichiers (index.html, CSS, etc.)
git add .
git commit -m "Description de vos modifications"
git push origin main
```

Attendez 2-3 minutes → Votre site est mis à jour ! 🎉

**URL du site :** https://waner1er.github.io/erwan-rivet/

---

### 2️⃣ GitHub Actions (AUTOMATIQUE avec Workflow)

Le fichier `.github/workflows/deploy.yml` a été créé pour vous.

**Avantages :**
- ✅ Déploiement automatique avec GitHub Actions
- ✅ Plus de contrôle sur le processus de déploiement
- ✅ Logs détaillés dans l'onglet "Actions"

**Configuration (à faire une seule fois) :**

1. Allez sur : https://github.com/waner1er/erwan-rivet/settings/pages
2. Configurez :
   - **Source** : `GitHub Actions`
3. Sauvegardez

**Pour redéployer :**

Même chose que précédemment :

```bash
git add .
git commit -m "Mise à jour"
git push origin main
```

Le workflow GitHub Actions se déclenche automatiquement et déploie votre site.

**Suivi du déploiement :**
- Allez sur : https://github.com/waner1er/erwan-rivet/actions
- Vous verrez le statut du déploiement en temps réel

---

### 3️⃣ Déploiement Manuel (FTP)

Si vous hébergez le site sur un serveur traditionnel (OVH, Hostinger, etc.)

**Étapes :**

1. **Récupérez les derniers fichiers :**
```bash
git pull origin main
```

2. **Connectez-vous via FTP/SFTP :**
   - Host : votre-serveur.com
   - Username : votre-nom-utilisateur
   - Password : votre-mot-de-passe

3. **Uploadez les fichiers :**
   - Uploadez tous les fichiers vers `public_html` ou `www`
   - Assurez-vous que `index.html` est à la racine

4. **Vérifiez :**
   - Visitez votre site : http://votre-domaine.com

---

## 🔧 Déploiement sur d'autres plateformes

### Netlify

1. Connectez votre repository GitHub à Netlify
2. Configuration :
   - **Build command** : (laissez vide)
   - **Publish directory** : `.` (racine)
3. Chaque push déclenche un déploiement automatique

### Vercel

1. Importez le projet depuis GitHub
2. Configuration :
   - **Framework Preset** : Other
   - **Build Command** : (laissez vide)
   - **Output Directory** : `.` (racine)
3. Déploiement automatique à chaque push

---

## ⚡ Workflow de Développement Recommandé

1. **Travaillez sur une branche séparée :**
```bash
git checkout -b feature/nouvelle-fonctionnalite
# Faites vos modifications
git add .
git commit -m "Ajout de nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite
```

2. **Créez une Pull Request sur GitHub**

3. **Testez, relisez, puis mergez dans main**

4. **Le site est automatiquement redéployé !**

---

## 🧪 Tester Localement Avant de Déployer

```bash
# Option 1 : Python
python -m http.server 8000

# Option 2 : PHP
php -S localhost:8000

# Option 3 : Node.js
npx http-server
```

Visitez : http://localhost:8000

---

## 📊 Vérifier le Statut du Déploiement

### GitHub Pages

- Allez sur : Settings → Pages
- Vous verrez le statut et l'URL du site

### GitHub Actions

- Allez sur : https://github.com/waner1er/erwan-rivet/actions
- Cliquez sur le dernier workflow pour voir les détails

---

## ❓ FAQ

**Q : Combien de temps prend le déploiement ?**
R : Généralement 2-3 minutes après le push.

**Q : Mon site ne se met pas à jour ?**
R : 
1. Vérifiez que votre push a bien été effectué : `git log`
2. Vérifiez les Actions GitHub pour voir les erreurs
3. Videz le cache de votre navigateur (Ctrl+F5)
4. Attendez quelques minutes supplémentaires

**Q : Puis-je utiliser un nom de domaine personnalisé ?**
R : Oui ! Dans Settings → Pages → Custom domain, ajoutez votre domaine et configurez vos DNS.

**Q : Le déploiement est-il gratuit ?**
R : Oui, GitHub Pages est complètement gratuit pour les repositories publics !

---

## 🎉 Résumé

**Pour redéployer simplement :**

```bash
git add .
git commit -m "Mise à jour"
git push origin main
```

C'est tout ! GitHub Pages s'occupe du reste automatiquement. 🚀
