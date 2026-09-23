// Utilisé uniquement par la configuration de build "web" (déploiement Netlify/Vercel), pas par
// le build "production" par défaut (celui-là reste sur localhost:8000, utilisé par l'appli
// desktop Electron qui embarque son propre backend local).
export const environment = {
  production: true,
  // À remplacer par l'URL réelle du service Render une fois créé, ex. :
  // 'https://livraison-app-backend.onrender.com/api'
  apiUrl: 'https://REMPLACER-PAR-URL-RENDER.onrender.com/api',
};
