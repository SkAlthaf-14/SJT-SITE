# SJT FARMS

Premium Coffee Powder — From Our Farm. To Your Perfect Cup.

Production website:
https://sjtfarms.com/

Admin Portal:
https://sjtfarms.com/admin/

Firebase Project:
sjtfarms-5eaeb

---

## 1. Project Overview

SJT FARMS is a production-ready coffee e-commerce website designed for showcasing and selling coffee products online.

The website provides:

- Premium coffee product showcase
- Product details
- Shopping cart
- Checkout
- Customer authentication
- Customer profiles
- Order management
- Reviews
- Contact forms
- Admin dashboard
- Responsive mobile, tablet and desktop design
- SEO configuration
- Google Search Console integration
- Firebase backend
- Firebase Hosting
- Custom domain
- SJT FARMS branding and favicon

---

## 2. Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Responsive CSS
- Framer Motion / animation libraries used by the project

### Backend

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting

### Authentication

The website supports:

- Email and password authentication
- Google authentication
- Customer profiles
- Admin role-based access

---

## 3. Production URLs

### Main Website

https://sjtfarms.com/

### Admin Portal

https://sjtfarms.com/admin/

### Sitemap

https://sjtfarms.com/sitemap.xml

### Robots.txt

https://sjtfarms.com/robots.txt

---

## 4. Firebase Project

Firebase Project ID:

sjtfarms-5eaeb

Firebase is used as the primary backend and source of truth.

The project uses:

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting

No Google Sheets or Apps Script integration is required for the current production system.

---

## 5. Firestore Collections

The application uses Firestore for application data.

Main collections include:

- users
- products
- orders
- payments
- reviews
- contacts
- categories
- newsletter

The exact fields and application logic are implemented in the source code.

---

## 6. User Roles

The application supports role-based access.

### Customer

Normal registered users can:

- Manage their profile
- Browse products
- Add products to cart
- Checkout
- View their orders
- Submit reviews where supported

### Admin

Users with the admin role can access:

https://sjtfarms.com/admin/

Admin functionality includes the management features implemented in the current Admin Dashboard.

Admin access is controlled through Firebase authentication and Firestore security rules.

---

## 7. Admin Access

To provide Admin Portal access to a client or administrator:

1. Create/register the user's account.
2. Locate the user's Firebase Authentication UID.
3. Ensure the corresponding Firestore user document exists.
4. Set the user's role to:

admin

5. Save the change.
6. Ask the user to sign out and sign in again.
7. Open:

https://sjtfarms.com/admin/

Do not share another user's password.

Each administrator should use their own account.

---

## 8. Website Structure

Main public pages include:

- Home
- Shop
- Product Details
- Brew Guide
- Our Farm
- About
- Reviews
- Subscription
- Accessories
- Contact
- FAQ

E-commerce pages include:

- Cart
- Checkout
- Order Success

Administrative pages are protected separately.

---

## 9. Project Structure

The main project structure is:

    src/
    ├── components/
    ├── context/
    ├── pages/
    ├── services/
    ├── types/
    └── ...

    public/
    ├── images/
    ├── favicon.png
    ├── favicon.svg
    ├── apple-touch-icon.png
    ├── robots.txt
    └── sitemap.xml

    scripts/
    ├── generate-favicons.py
    ├── generate-static-seo-pages.mjs
    └── verify-production-head.mjs

    index.html
    package.json
    package-lock.json
    firebase.json
    firestore.rules
    firestore.indexes.json
    vite.config.*
    README.md

The exact folders may vary depending on the current source version.

---

## 10. Brand Assets

Main SJT FARMS logo:

    public/images/sjt-farms-logo.png

Favicon:

    public/favicon.png

SVG favicon:

    public/favicon.svg

Apple touch icon:

    public/apple-touch-icon.png

These assets are already configured for the production website.

---

## 11. SEO

The production website includes:

- SEO title
- Meta description
- Canonical URLs
- Organization structured data
- LocalBusiness structured data
- WebSite structured data
- Open Graph metadata
- Favicon
- Sitemap
- Robots.txt
- Production HTTPS URLs

Production domain:

https://sjtfarms.com/

The sitemap is:

https://sjtfarms.com/sitemap.xml

Google Search Console indexing has been requested for the production website.

Important:

Google controls its own crawling, indexing and search-result appearance.

Search ranking or a specific Google position cannot be guaranteed.

---

## 12. Favicon and Logo

The production favicon is available at:

https://sjtfarms.com/favicon.png

The main brand logo is available at:

https://sjtfarms.com/images/sjt-farms-logo.png

Google may take time to refresh the favicon or logo in search results after deployment and indexing.

---

## 13. Local Development

### Requirements

Install:

- Node.js
- npm
- Firebase CLI

### Install dependencies

    npm install

### Start development server

    npm run dev

The terminal will provide the local development URL.

---

## 14. Production Build

Before deployment, create a production build:

    npm run build

The build should complete successfully before deployment.

The production files are generated in:

    dist/

---

## 15. Firebase Deployment

Make sure the Firebase CLI is authenticated with the correct Google account.

Confirm the project:

    firebase use sjtfarms-5eaeb

Build the application:

    npm run build

Deploy Firebase Hosting:

    firebase deploy --only hosting

After deployment, verify:

https://sjtfarms.com/

---

## 16. Firebase Security

Firestore security rules are located at:

    firestore.rules

Security rules protect:

- Customer information
- Orders
- Payments
- Admin functionality
- Other application data

Do not replace production security rules with:

    allow read, write: if true;

Never disable Firestore security rules for convenience.

---

## 17. Environment Variables

Never commit private environment files or secrets to GitHub.

Do not upload:

    .env
    .env.local
    .env.production

Use an `.env.example` file if environment variables need to be documented.

Never commit:

- Firebase Admin service-account JSON
- Private keys
- Passwords
- Authentication tokens
- Secret API credentials

---

## 18. GitHub

The source code should be maintained in a private GitHub repository.

The client should receive repository access after project handover.

Recommended repository protection:

- Keep the repository private if appropriate.
- Never commit secrets.
- Keep the production source code backed up.
- Use meaningful commit messages.

---

## 19. Domain

Production domain:

https://sjtfarms.com/

The domain should remain under the client's ownership after final handover.

Domain management is separate from Firebase Hosting.

---

## 20. Google Search Console

Google Search Console is used for:

- Search indexing
- Search performance
- Sitemap submission
- URL inspection
- Indexing monitoring

The client should be added as an authorized user to the appropriate Search Console property.

---

## 21. Client Handover

The client should receive access to:

### Website

https://sjtfarms.com/

### Admin Portal

https://sjtfarms.com/admin/

### Firebase

Firebase project:

sjtfarms-5eaeb

### Domain

sjtfarms.com

### Source Code

GitHub repository access.

### Google Search Console

Appropriate client Google account access.

### Documentation

This README and any additional project documentation.

---

## 22. Important Handover Rule

Do not share personal Google account passwords.

Each service should be transferred or shared using its official account/member/permission system.

The client should eventually control:

- Domain
- Firebase project
- GitHub/source code
- Google Search Console
- Admin accounts
- Business-related credentials

---

## 23. Backup

Before making major production changes, maintain a backup of:

- Source code
- Firebase configuration
- Firestore configuration
- Branding assets
- SEO files
- Deployment configuration

Do not store private credentials inside the backup.

---

## 24. Maintenance

Future changes should follow this process:

1. Make changes locally.
2. Test the website.
3. Run:

       npm run build

4. Fix any build errors.
5. Test the important website flows.
6. Deploy:

       firebase deploy --only hosting

7. Verify the production website.

Avoid making untested changes directly to production.

---

## 25. Important Production Information

Brand:

SJT FARMS

Tagline:

FROM OUR FARM. TO YOUR PERFECT CUP.

Website:

https://sjtfarms.com/

Admin:

https://sjtfarms.com/admin/

Firebase Project:

sjtfarms-5eaeb

---

## 26. Final Handover Checklist

Before final client acceptance:

- [ ] Website opens correctly
- [ ] HTTPS works
- [ ] Custom domain works
- [ ] Customer registration works
- [ ] Customer login works
- [ ] Google login works
- [ ] Customer profile works
- [ ] Products work
- [ ] Cart works
- [ ] Checkout works
- [ ] Orders work
- [ ] Admin login works
- [ ] Admin dashboard works
- [ ] Firestore security rules are active
- [ ] Mobile layout works
- [ ] Desktop layout works
- [ ] Logo works
- [ ] Favicon works
- [ ] Sitemap works
- [ ] robots.txt works
- [ ] SEO metadata is configured
- [ ] Google Search Console access is provided
- [ ] Firebase access is provided
- [ ] Domain access is provided
- [ ] GitHub/source-code access is provided
- [ ] Client has tested the website
- [ ] Client has accepted the delivery

---

## 27. Project Status

Current production status:

READY FOR CLIENT HANDOVER

The website is deployed on Firebase Hosting and uses the SJT FARMS custom domain.

Google Search indexing has been requested.

Google search-result appearance and ranking remain controlled by Google and may take time to update.