# ShopWave ERP

> Plateforme e-commerce B2C tunisienne étendue en système ERP complet.
> **Stack :** Django REST Framework · React · PostgreSQL · Redis · Celery · WebSocket

---

## Sommaire

1. [Présentation](#présentation)
2. [Architecture](#architecture)
3. [Modules ERP ajoutés](#modules-erp-ajoutés)
4. [Prérequis](#prérequis)
5. [Installation — Option A : Docker (recommandé)](#option-a--docker-recommandé)
6. [Installation — Option B : Manuelle (développement)](#option-b--manuelle-développement)
7. [Commandes utiles](#commandes-utiles)
8. [Endpoints API ERP](#endpoints-api-erp)
9. [Accès & Rôles](#accès--rôles)
10. [Variables d'environnement](#variables-denvironnement)

---

## Présentation

ShopWave est parti d'une plateforme e-commerce full-stack et a été étendu en **ERP minimal fonctionnel** par l'ajout de trois modules couvrant l'intégralité du cycle de valeur de l'entreprise :

| Module | Domaine | Statut |
|--------|---------|--------|
| `apps.purchasing` | Achats & Fournisseurs | 🆕 Ajouté |
| `apps.accounting` | Comptabilité & Finance | 🆕 Ajouté |
| `apps.hr` | Ressources Humaines | 🆕 Ajouté |
| `apps.orders` | Ventes & Commandes | ✅ Existant |
| `apps.products` | Catalogue & Stocks | ✅ Existant |
| `apps.users` | Utilisateurs & Auth | ✅ Existant |
| + 6 autres | Cart, Reviews, Coupons… | ✅ Existant |

---

## Architecture

```
e_commerce/
├── backend/                  # Django REST API
│   ├── apps/
│   │   ├── purchasing/       # 🆕 Fournisseurs, BCs, Factures
│   │   ├── accounting/       # 🆕 Plan comptable, Écritures, Rapports
│   │   ├── hr/               # 🆕 Employés, Congés, Paie
│   │   ├── orders/           # Commandes clients
│   │   ├── products/         # Catalogue
│   │   ├── users/            # Auth JWT
│   │   ├── cart/             # Panier
│   │   ├── payments/         # Stripe + COD
│   │   ├── notifications/    # WebSocket
│   │   ├── chatbot/          # NLP interne
│   │   ├── reviews/          # Avis produits
│   │   ├── coupons/          # Codes promo
│   │   ├── shipping/         # Livraison
│   │   └── admin_api/        # Dashboard analytique
│   ├── config/
│   │   ├── settings.py       # ✏️  Modifié (+ 3 apps ERP)
│   │   ├── urls.py           # ✏️  Modifié (+ 4 routes ERP)
│   │   ├── asgi.py
│   │   └── celery.py
│   ├── Dockerfile            # 🆕
│   ├── requirements.txt      # ✏️  + reportlab
│   └── manage.py
├── frontend/                 # React + Vite
│   └── Dockerfile            # 🆕
├── docker-compose.yml        # 🆕
├── .env.example              # 🆕
└── README.md                 # 🆕
```

---

## Modules ERP ajoutés

### `apps.purchasing` — Achats & Fournisseurs
- Gestion des **fournisseurs** (Supplier) avec portail dédié
- **Bons de commande** (PurchaseOrder) : brouillon → envoi → confirmation → réception
- Mise à jour automatique des **stocks produits** à la réception
- **Factures fournisseurs** (SupplierInvoice) : soumission → validation → paiement

### `apps.accounting` — Comptabilité
- **Plan comptable tunisien** initialisé via commande (`seed_accounting_plan`)
- **Écritures comptables** en partie double (débit = crédit)
- **Comptabilisation automatique** des ventes via Django signals
- **Comptabilisation automatique** des paies (lien avec HR)
- Rapports : Balance générale, Compte de résultat, Déclaration TVA

### `apps.hr` — Ressources Humaines
- **Départements** et organigramme
- **Fiches employés** avec CIN, CNSS, contrat, salaire
- **Demandes de congés** : soumission → approbation/refus
- **Paie mensuelle** avec calcul automatique CNSS (9.18% / 16.57%) et IRPP (barème progressif tunisien)
- Génération en **lot** pour tous les employés actifs

---

## Prérequis

### Option Docker
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) ≥ 2.0 (inclus dans Docker Desktop)

### Option Manuelle
- Python ≥ 3.11
- Node.js ≥ 20
- PostgreSQL ≥ 15
- Redis ≥ 7

---

## Option A — Docker (recommandé)

C'est la méthode la plus simple : **une seule commande** démarre toute la stack.

### Étape 1 — Cloner / dézipper le projet

```bash
unzip shopwave_erp.zip
cd e_commerce
```

### Étape 2 — Configurer l'environnement

```bash
cp .env.example .env
# Éditer .env si nécessaire (les valeurs par défaut fonctionnent en dev)
```

### Étape 3 — Démarrer tous les services

```bash
docker compose up --build
```

> ⏳ Le premier démarrage prend 2-4 minutes (téléchargement des images, installation des dépendances).

Au démarrage, le backend exécute automatiquement :
- `python manage.py migrate` — toutes les migrations (y compris les 3 nouveaux modules ERP)
- `python manage.py seed_accounting_plan` — initialise le plan comptable tunisien
- `python manage.py create_erp_groups` — crée les groupes de permissions ERP

### Étape 4 — Créer un superutilisateur

Dans un nouveau terminal :

```bash
docker compose exec backend python manage.py createsuperuser
```

### Étape 5 — Accéder aux interfaces

| Service | URL |
|---------|-----|
| **Frontend React** | http://localhost:3000 |
| **API Backend** | http://localhost:8000 |
| **Swagger / Docs API** | http://localhost:8000/api/docs/ |
| **Django Admin** | http://localhost:8000/admin/ |

### Arrêter les services

```bash
docker compose down          # Arrête les conteneurs
docker compose down -v       # Arrête ET supprime les volumes (reset BDD)
```

---

## Option B — Manuelle (développement)

### 1. PostgreSQL

Créer la base de données :

```sql
-- Dans psql ou pgAdmin
CREATE DATABASE shopwave_erp;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE shopwave_erp TO postgres;
```

### 2. Redis

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu/Debian
sudo apt install redis-server && sudo systemctl start redis

# Windows
# Télécharger depuis https://github.com/tporadowski/redis/releases
```

### 3. Backend Django

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer l'environnement
cp ../.env.example ../.env
# Éditer .env avec vos paramètres DB

# Appliquer toutes les migrations
python manage.py migrate

# Initialiser le plan comptable tunisien
python manage.py seed_accounting_plan

# Créer les groupes ERP (Fournisseur, Comptable, Responsable RH)
python manage.py create_erp_groups

# (Optionnel) Charger des données de démonstration
python manage.py seed_data

# Créer un superutilisateur
python manage.py createsuperuser

# Démarrer le serveur de développement
python manage.py runserver
# ou avec WebSocket support :
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### 4. Celery (dans un nouveau terminal)

```bash
cd backend
source venv/bin/activate
celery -A config worker -l info
```

### 5. Frontend React

```bash
cd frontend
npm install
npm run dev
```

### 6. Accéder aux interfaces

| Service | URL |
|---------|-----|
| **Frontend React** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **Swagger Docs** | http://localhost:8000/api/docs/ |
| **Django Admin** | http://localhost:8000/admin/ |

---

## Commandes utiles

### Migrations

```bash
# Appliquer toutes les migrations
python manage.py migrate

# Créer les migrations pour un module spécifique
python manage.py makemigrations purchasing
python manage.py makemigrations accounting
python manage.py makemigrations hr

# Vérifier l'état des migrations
python manage.py showmigrations
```

### Données initiales ERP

```bash
# Initialiser le plan comptable tunisien (26 comptes de base)
python manage.py seed_accounting_plan

# Créer les 3 groupes de permissions ERP
python manage.py create_erp_groups

# Données e-commerce de démonstration (produits, catégories, etc.)
python manage.py seed_data
```

### Administration

```bash
# Créer un superutilisateur
python manage.py createsuperuser

# Générer le schéma OpenAPI
python manage.py spectacular --file schema.yml

# Collecter les fichiers statiques
python manage.py collectstatic
```

---

## Endpoints API ERP

### Authentification
Tous les endpoints ERP requièrent un token JWT : `Authorization: Bearer <token>`

```bash
# Obtenir un token
POST /api/auth/login/
{ "email": "admin@shopwave.com", "password": "..." }
```

### Module Purchasing — Achats

```
GET  /api/purchasing/suppliers/              Liste des fournisseurs
POST /api/purchasing/suppliers/              Créer un fournisseur
GET  /api/purchasing/orders/                 Liste des bons de commande
POST /api/purchasing/orders/                 Créer un BC
POST /api/purchasing/orders/{id}/send/       Envoyer au fournisseur
POST /api/purchasing/orders/{id}/confirm/    Fournisseur confirme
POST /api/purchasing/orders/{id}/receive/    Réceptionner marchandises
POST /api/purchasing/invoices/{id}/validate/ Valider facture fournisseur
POST /api/purchasing/invoices/{id}/mark_paid/ Marquer comme payée

# Portail Fournisseur
GET  /api/supplier-portal/orders/            Mes bons de commande
POST /api/supplier-portal/invoices/          Soumettre une facture
```

### Module Accounting — Comptabilité

```
GET  /api/accounting/accounts/              Plan comptable
POST /api/accounting/entries/               Saisir écriture manuelle
POST /api/accounting/entries/{id}/post_entry/ Valider une écriture
GET  /api/accounting/entries/balance/       Balance générale
GET  /api/accounting/entries/income_statement/ Compte de résultat
GET  /api/accounting/entries/tva_declaration/  Déclaration TVA
POST /api/accounting/periods/{id}/close/    Clôturer une période
```

### Module HR — Ressources Humaines

```
GET  /api/hr/departments/                   Liste des départements
GET  /api/hr/employees/                     Liste des employés
POST /api/hr/employees/                     Créer un employé
POST /api/hr/employees/{id}/terminate/      Terminer un contrat
GET  /api/hr/leaves/                        Demandes de congés
POST /api/hr/leaves/{id}/approve/           Approuver un congé
POST /api/hr/leaves/{id}/reject/            Refuser un congé
POST /api/hr/payrolls/                      Créer une fiche de paie
POST /api/hr/payrolls/generate_batch/       Générer toutes les paies du mois
POST /api/hr/payrolls/{id}/validate/        Valider la fiche
POST /api/hr/payrolls/{id}/pay/             Marquer comme payée (→ écriture comptable)
GET  /api/hr/payrolls/summary/              Résumé masse salariale du mois
```

---

## Accès & Rôles

| Rôle | Accès | Comment attribuer |
|------|-------|-------------------|
| **Superadmin** | Tout | `createsuperuser` |
| **Administrateur** | Tous modules via Django Admin | `is_staff = True` |
| **Comptable** | accounting + purchasing/invoices | Groupe "Comptable" |
| **Responsable RH** | hr complet | Groupe "Responsable RH" |
| **Fournisseur** | Portail supplier uniquement | Groupe "Fournisseur" + `OneToOne` Supplier |
| **Client** | Boutique, commandes, chatbot | Inscription publique |

### Attribuer un rôle via Django Admin

1. Aller sur `/admin/`
2. **Utilisateurs** → sélectionner l'utilisateur
3. Section **Groupes** → ajouter le groupe souhaité
4. Pour les fournisseurs : créer d'abord le `Supplier`, puis lier le champ `user`

---

## Variables d'environnement

Copier `.env.example` en `.env` et remplir :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `SECRET_KEY` | Clé secrète Django | `django-insecure-...` |
| `DEBUG` | Mode debug | `True` |
| `DB_NAME` | Nom de la base | `shopwave_erp` |
| `DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `postgres` |
| `DB_HOST` | Hôte PostgreSQL | `localhost` (ou `db` avec Docker) |
| `REDIS_URL` | URL Redis | `redis://localhost:6379/0` |
| `STRIPE_SECRET_KEY` | Clé Stripe (optionnel) | vide |
| `EMAIL_HOST_USER` | Email SMTP (optionnel) | vide |

---

## Structure des nouvelles migrations

Après `python manage.py migrate`, les tables suivantes sont créées :

**Purchasing :**
- `suppliers`
- `purchase_orders`
- `purchase_order_lines`
- `supplier_invoices`

**Accounting :**
- `accounting_accounts`
- `fiscal_periods`
- `journal_entries`
- `journal_entry_lines`

**HR :**
- `hr_departments`
- `hr_employees`
- `hr_leave_requests`
- `hr_payrolls`

---

## Flux ERP typique

```
1. ACHAT
   Admin crée un Supplier
   → Crée un PurchaseOrder (draft)
   → Envoie au fournisseur (sent)
   → Fournisseur confirme via portail (confirmed)
   → Admin réceptionne → stock mis à jour automatiquement (received)
   → Fournisseur soumet SupplierInvoice
   → Comptable valide la facture (validated)
   → Paiement enregistré → écriture comptable générée (paid)

2. VENTE
   Client passe commande → paiement
   → Signal Django génère automatiquement l'écriture comptable
   → Comptable consulte le grand livre / compte de résultat

3. PAIE
   RH génère les fiches de paie du mois (generate_batch)
   → Calcul automatique CNSS + IRPP
   → Validation par RH
   → Paiement → écriture comptable générée automatiquement

4. REPORTING
   Comptable génère Balance générale
   → Compte de résultat (Produits - Charges)
   → Déclaration TVA mensuelle
   → Clôture de période
```

---

*ShopWave ERP — 2026 — Développé avec Django REST Framework & React*

---

## Interfaces Frontend ERP

### Nouvelles URLs React

| URL | Interface | Accès |
|-----|-----------|-------|
| `/erp` | Tableau de bord ERP | Admin, Comptable, RH |
| `/erp/purchasing` | Bons de commande | Admin |
| `/erp/suppliers` | Fournisseurs | Admin |
| `/erp/invoices` | Factures fournisseurs | Admin, Comptable |
| `/erp/accounting` | Grand Livre | Admin, Comptable |
| `/erp/balance` | Balance générale | Admin, Comptable |
| `/erp/tva` | Déclaration TVA | Admin, Comptable |
| `/erp/periods` | Périodes fiscales | Admin, Comptable |
| `/erp/employees` | Employés | Admin, RH |
| `/erp/leaves` | Congés | Admin, RH |
| `/erp/payroll` | Paie mensuelle | Admin, RH |
| `/supplier` | Portail fournisseur — Mes commandes | Fournisseur |
| `/supplier/invoices` | Portail fournisseur — Mes factures | Fournisseur |

### Fichiers frontend créés

```
frontend/src/
├── services/
│   └── erpApi.js                  # Tous les appels API ERP
├── components/erp/
│   ├── ErpUI.jsx                  # Composants UI partagés (Table, Modal, Badge, etc.)
│   └── ErpLayout.jsx              # Layout sidebar ERP adaptatif par rôle
├── pages/erp/
│   ├── ErpDashboard.jsx           # Tableau de bord avec KPIs selon rôle
│   ├── PurchasingPages.jsx        # Fournisseurs + BCs + Factures
│   ├── AccountingPages.jsx        # Grand Livre + Balance + TVA + Périodes
│   └── HRPages.jsx                # Employés + Congés + Paie
└── pages/supplier/
    └── SupplierPortal.jsx         # Layout + Commandes + Factures (fournisseur)
```
