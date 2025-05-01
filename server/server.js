const express = require('express')
const dotEnv = require('dotenv')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const yaml = require('yamljs')
const swaggerDocs = yaml.load('./swagger.yaml')
const dbConnection = require('./database/connection')

dotEnv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Connect to the database
dbConnection()

const corsOptions = {
  // origin: function (origin, callback) {
  //   // Autorise toutes les origines en développement ou les origines spécifiques en production
  //   if (process.env.NODE_ENV !== 'production' || !origin || process.env.ALLOWED_ORIGINS.split(',').indexOf(origin) !== -1) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error('Not allowed by CORS'));
  //   }
  // },
  // origin: process.env.NODE_ENV === 'production' 
  //   ? ['https://argent-bank-gamma.vercel.app', 'https://project-10-bank-api.onrender.com'] 
  //   : ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'],
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

// // Modifier swaggerDocs avant de le passer à Swagger UI
// if (process.env.NODE_ENV === 'production') {
//   swaggerDocs.host = 'project-10-bank-api.onrender.com';
//   swaggerDocs.schemes = ['https'];
// } else {
//   swaggerDocs.host = `localhost:${PORT}`;
//   swaggerDocs.schemes = ['http'];
// }



// // Log la configuration Swagger
// console.log('Configuration Swagger:');
// console.log('Host:', swaggerDocs.host);
// console.log('Schemes:', swaggerDocs.schemes);
// console.log('BasePath:', swaggerDocs.basePath);

// // Créer un endpoint pour servir la spec Swagger en JSON
// app.get('/api-docs/swagger.json', (req, res) => {
//   // Cloner l'objet pour éviter de modifier l'original
//   const swaggerSpec = JSON.parse(JSON.stringify(swaggerDocs));
  
//   // En production, forcer l'utilisation de HTTPS
//   if (process.env.NODE_ENV === 'production') {
//     swaggerSpec.schemes = ['https'];
//   }
  
//   res.json(swaggerSpec);
// });

// Fonction pour déterminer si on est en production
const isProduction = () => process.env.NODE_ENV === 'production';

// Créer un endpoint pour servir la spec Swagger en JSON avec les bonnes URLs
app.get('/api-docs/swagger.json', (req, res) => {
  // Cloner l'objet pour ne pas modifier l'original
  const swaggerSpec = JSON.parse(JSON.stringify(swaggerDocs));
  
  if (isProduction()) {
    // En production, utiliser l'URL complète et HTTPS
    swaggerSpec.host = 'project-10-bank-api.onrender.com';
    swaggerSpec.schemes = ['https'];
    
    // Force les URLs à être HTTPS dans la spec
    if (swaggerSpec.securityDefinitions && swaggerSpec.securityDefinitions.Bearer) {
      swaggerSpec.securityDefinitions.Bearer.description = 
        swaggerSpec.securityDefinitions.Bearer.description.replace('http://', 'https://');
    }
  } else {
    // En développement, utiliser localhost avec le port
    swaggerSpec.host = `localhost:${PORT}`;
    swaggerSpec.schemes = ['http'];
  }
  
  res.json(swaggerSpec);
});

// Configuration des options Swagger UI
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    url: '/api-docs/swagger.json',
    defaultModelsExpandDepth: -1,
    docExpansion: 'list',
    persistAuthorization: true
  }
};

// API Documentation
// if (process.env.NODE_ENV !== 'production') {
  // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, swaggerUiOptions));
// }

// Handle custom routes
app.use('/api/v1/user', require('./routes/userRoutes'))

// app.get('/', (req, res, next) => {
//   res.send('Hello from my Express server v2!')
// })

// Route de base
app.get('/', (req, res, next) => {
  res.send(`
    <html>
      <head><title>Bank API Server</title></head>
      <body>
        <h1>Hello from Bank API Server!</h1>
        <p>Environment: ${isProduction() ? 'Production' : 'Development'}</p>
        <p>Server is running on port: ${PORT}</p>
        <p><a href="/api-docs">Access API Documentation</a></p>
      </body>
    </html>
  `);
});

// Rediriger HTTP vers HTTPS en production
// if (process.env.NODE_ENV === 'production') {
//   app.use((req, res, next) => {
//     if (req.headers['x-forwarded-proto'] !== 'https') {
//       return res.redirect(`https://${req.headers.host}${req.url}`);
//     }
//     next();
//   });
// }

// Rediriger HTTP vers HTTPS en production
if (isProduction()) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Endpoint de diagnostic (uniquement en dev)
if (!isProduction()) {
  app.get('/env-check', (req, res) => {
    res.json({
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      host: req.headers.host,
      protocol: req.protocol,
      isProduction: isProduction()
    });
  });
}

app.listen(PORT, () => {
  const serverUrl = process.env.NODE_ENV === 'production' 
    ? `https://project-10-bank-api.onrender.com` 
    : `http://localhost:${PORT}`;
  
  console.log(`Server listening on port ${PORT}`);
  console.log(`Server URL: ${serverUrl}`);
  console.log(`Swagger documentation: ${serverUrl}/api-docs`);
})

// // Middleware pour journaliser les requêtes en développement
// if (process.env.NODE_ENV !== 'production') {
//   app.use((req, res, next) => {
//     console.log(`${req.method} ${req.url}`);
//     next();
//   });
// }

// app.listen(PORT, () => {
//   console.log(`Server listening on ${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://localhost:${PORT}`)
//   console.log(`Swagger documentation available at ${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://localhost:${PORT}/api-docs`);
// })
