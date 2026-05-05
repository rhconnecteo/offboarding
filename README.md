## Offboarding Checker — Formulaire Check & Mail Connecteo

Ce dossier contient un formulaire web complet pour vérifier les départs d'employés et marquer leur check/date de désactivation.

### Fichiers

- **`Code.gs`**: Backend Apps Script (API + accès à la feuille "Demission")
- **`index.html`**: Page web principale (affiche la table avec tous les champs)
- **`script.js`**: Logique client (charge les données, affiche la table, marque les checks)
- **`style.css`**: Styles modernes et premium pour le formulaire

### Colonnes gérées

Le formulaire affiche et gère les colonnes suivantes :
- Matricule
- Nom et Prénom
- Fonction
- Date de départ
- Motif de départ
- Login
- **Mail connecteo** ← mis en gras pour visualisation rapide
- **Check** ← affiche ✓ quand validé
- **Date de désactivation** ← remplie automatiquement lors du check

### Déploiement

1. **Créer un projet Apps Script** :
   - Ouvrez https://script.google.com
   - Créez un nouveau projet
   - Copiez/collez le contenu de `Code.gs` dans le fichier `Code.gs` du projet

2. **Vérifier la configuration** :
   - Assurez-vous que `SHEET_ID` et `SHEET_NAME` dans `Code.gs` sont corrects
   - ID fourni: `1nL61HqFb9EKNmurLfT9qgo0U05bKqXqY1rKw0hC4klQ`
   - Feuille: `Demission`

3. **Déployer comme webapp** :
   - Cliquez sur **Déployer** → **Nouveau déploiement**
   - Type: **Application web**
   - Exécuter en tant que: **Moi** (votre compte)
   - Accès: **Toute personne** (ou votre domaine)
   - Copiez l'URL de déploiement

4. **Mettre à jour `script.js`** :
   - Remplacez la variable `API_BASE` par l'URL du webapp déployée

5. **Servir le formulaire** :
   - Placez `index.html`, `script.js`, et `style.css` sur un serveur web
   - Ou ouvrez `index.html` localement (certaines fonctionnalités peuvent être limitées)

### Utilisation

1. Ouvrez le formulaire dans votre navigateur
2. La table charge automatiquement les employés de la feuille "Demission"
3. Cliquez sur **"Confirmer Check"** pour marquer un employé comme vérifié
4. La colonne `Check` devient ✓ et la colonne `Date de désactivation` se remplisseur automatiquement
5. Les lignes validées s'affichent avec une opacité réduite (grisées)

### Design

- Fond gradient moderne
- Gradient cyan → violet sur le titre
- Table avec surbrillance au survol
- Alertes de confirmation animées
- Design responsive pour mobile
- Créé pour plaire au PDG ✨

### Dépannage

- **Erreur "Colonnes introuvables"** : Vérifiez que votre feuille a bien les colonnes `Check` et `Date de désactivation`
- **Données non chargées** : Vérifiez que l'URL du webapp dans `script.js` est correcte
- **Permissions** : Assurez-vous que l'accès au webapp est configuré correctement lors du déploiement
