// Utilisé uniquement par la configuration de build "web" (déploiement Netlify/Vercel), pas par
// le build "production" par défaut (celui-là reste sur localhost:8000, utilisé par l'appli
// desktop Electron qui embarque son propre backend local).
export const environment = {
  production: true,
  apiUrl: 'https://livraison-app-backend.onrender.com/api',
};
