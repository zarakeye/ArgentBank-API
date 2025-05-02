const express = require('express')
const dotEnv = require('dotenv')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const yaml = require('yamljs')
const fs = require('fs')
const path = require('path');
// const swaggerDocs = yaml.load(path.join(__dirname, '../swagger.yaml'));
const dbConnection = require('./database/connection')

dotEnv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Fonction pour déterminer si on est en production
const isProduction = () => process.env.NODE_ENV === 'production';

// Connect to the database
dbConnection()

// // Rediriger HTTP vers HTTPS en production
// if (isProduction()) {
//   app.use((req, res, next) => {
//     if (req.headers['x-forwarded-proto'] !== 'https') {
//       return res.redirect(`https://${req.headers.host}${req.url}`);
//     }
//     next();
//   });
// }

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
// Handle CORS issues
app.use(cors(corsOptions))
// Request payload middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// Charger Swagger YAML en toute sécurité
let swaggerDocs;
try {
  const swaggerPath = path.join(__dirname, '../swagger.yaml');
  swaggerDocs = yaml.load(swaggerPath);

  // Définir l'host et le scheme dynamiquement
  if (isProduction()) {
    swaggerDocs.host = 'project-10-bank-api.onrender.com';
    swaggerDocs.schemes = ['https'];
  } else {
    swaggerDocs.host = `localhost:${PORT}`;
    swaggerDocs.schemes = ['http'];
  }

  // Générer un fichier JSON pour Swagger UI
  const swaggerOutputPath = path.join(__dirname, 'generated-swagger.json');
  fs.writeFileSync(swaggerOutputPath, JSON.stringify(swaggerDocs, null, 2));

  app.get('/generated-swagger.json', (req, res) => {
    res.sendFile(swaggerOutputPath);
  });

  // Swagger UI
  const swaggerUiOptions = {
    explorer: true,
    swaggerUrl: '/generated-swagger.json'
  };
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, swaggerUiOptions));

} catch (err) {
  console.error('Erreur lors du chargement de Swagger :', err.message);
}

// Redirection HTTP → HTTPS en production
if (isProduction()) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Handle custom routes
app.use('/api/v1/user', require('./routes/userRoutes'))

// Route de base
app.get('/', (req, res, next) => {
  res.send(`
    <html>
      <head><title>Argent Bank API Server</title></head>
      <body>
        <h1>Hello from Bank API Server!</h1>
        <p>Environment: ${isProduction() ? 'Production' : 'Development'}</p>
        <p>Server is running on port: ${PORT}</p>
        <p>Host: ${swaggerDocs.host}</p>
        <p>Schemes: ${swaggerDocs.schemes.join(', ')}</p>
        <p><a href="/api-docs">Access API Documentation</a></p>
      </body>
    </html>
  `);
});

// Endpoint de diagnostic (uniquement en dev)
if (!isProduction()) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

app.listen(PORT, () => {
  const serverUrl = isProduction()
    ? `https://project-10-bank-api.onrender.com` 
    : `http://localhost:${PORT}`;

  console.log(`✅ Server running at: ${serverUrl}`);  
})
