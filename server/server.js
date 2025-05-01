const express = require('express')
const dotEnv = require('dotenv')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const yaml = require('yamljs')
const swaggerDocs = yaml.load('./swagger.yaml')
const dbConnection = require('./database/connection')

// Fonction pour déterminer si on est en production
const isProduction = () => process.env.NODE_ENV === 'production';

dotEnv.config()

// Rediriger HTTP vers HTTPS en production
if (isProduction()) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

const app = express()
const PORT = process.env.PORT || 3001

// Connect to the database
dbConnection()

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

// Définir dynamiquement l'hôte et le schéma dans la spécification Swagger
// IMPORTANT: Cette configuration doit être faite avant d'utiliser swaggerDocs
if (isProduction()) {
  swaggerDocs.host = 'project-10-bank-api.onrender.com';
  swaggerDocs.schemes = ['https'];
} else {
  swaggerDocs.host = `localhost:${PORT}`;
  swaggerDocs.schemes = ['http'];
}

// Configuration des options Swagger UI
const swaggerUiOptions = {
  explorer: true,
  swaggerUrl: '/generated-swagger.json'
};

// Servir le fichier swagger généré
app.get('/generated-swagger.json', (req, res) => {
  res.sendFile(swaggerOutputPath);
});

// API Documentation
// if (process.env.NODE_ENV !== 'production') {
  // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, { explorer: true }));
// }

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
  const serverUrl = process.env.NODE_ENV === 'production' 
    ? `https://project-10-bank-api.onrender.com` 
    : `http://localhost:${PORT}`;
  
  console.log(`Server listening on port ${PORT}`);
  console.log(`Server URL: ${serverUrl}`);
  console.log(`Swagger host: ${swaggerDocs.host}`);
  console.log(`Swagger schemes: ${swaggerDocs.schemes}`)
  console.log(`Swagger documentation: ${serverUrl}/api-docs`);
})
