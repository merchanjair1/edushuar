const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const environment = process.env.NODE_ENV || 'development';

const isProduction = environment === 'production';

const envConfigFile = `export const environment = {
   production: ${isProduction},
   firebase: {
     apiKey: '${process.env.FIREBASE_API_KEY}',
     authDomain: '${process.env.FIREBASE_AUTH_DOMAIN}',
     projectId: '${process.env.FIREBASE_PROJECT_ID}',
     storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET}',
     messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
     appId: '${process.env.FIREBASE_APP_ID}'
   },
   cloudinary: {
     cloudName: '${process.env.CLOUDINARY_CLOUD_NAME}',
     uploadPreset: '${process.env.CLOUDINARY_UPLOAD_PRESET}'
   }
};
`;

const environmentsDir = './src/environments';
const targetPath = path.join(environmentsDir, 'environment.ts');
const targetProdPath = path.join(environmentsDir, 'environment.prod.ts');

// Ensure the environments directory exists
fs.mkdirSync(environmentsDir, { recursive: true });

fs.writeFile(targetPath, envConfigFile, function (err) {
   if (err) {
      console.log(err);
   }
   console.log(`Output generated at ${targetPath}`);
});

// For production environment, create a separate file
const prodEnvConfigFile = `export const environment = {
   production: true,
   firebase: {
     apiKey: '${process.env.FIREBASE_API_KEY}',
     authDomain: '${process.env.FIREBASE_AUTH_DOMAIN}',
     projectId: '${process.env.FIREBASE_PROJECT_ID}',
     storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET}',
     messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
     appId: '${process.env.FIREBASE_APP_ID}'
   },
   cloudinary: {
     cloudName: '${process.env.CLOUDINARY_CLOUD_NAME}',
     uploadPreset: '${process.env.CLOUDINARY_UPLOAD_PRESET}'
   }
};
`;

fs.writeFile(targetProdPath, prodEnvConfigFile, function (err) {
   if (err) {
      console.log(err);
   }
   console.log(`Output generated at ${targetProdPath}`);
});
