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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://argent-bank-gamma.vercel.app', 'https://project-10-bank-api.onrender.com'] 
    : ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Handle CORS issues
app.use(cors(corsOptions))

// Request payload middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Modifier swaggerDocs avant de le passer à Swagger UI
if (process.env.NODE_ENV === 'production') {
  swaggerDocs.host = 'project-10-bank-api.onrender.com';
  swaggerDocs.schemes = ['https'];
} else {
  swaggerDocs.host = `localhost:${PORT}`;
  swaggerDocs.schemes = ['http'];
}

// API Documentation
// if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))
// }

// Handle custom routes
app.use('/api/v1/user', require('./routes/userRoutes'))

app.get('/', (req, res, next) => {
  res.send('Hello from my Express server v2!')
})

// Rediriger HTTP vers HTTPS en production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`Server listening on ${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://localhost:${PORT}`)
})
