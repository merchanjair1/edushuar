# Requerimientos Técnicos - Repositorio Digital del Patrimonio Cultural Shuar (EduShuar)

## 1. Información del Proyecto

**Nombre del Proyecto:** EduShuar - Repositorio Digital del Patrimonio Cultural Shuar  
**Stack Tecnológico:** Angular 20, TailwindCSS, Firebase  
**Tipo de Aplicación:** Progressive Web App (PWA)  
**Idiomas Soportados:** Shuar, Español  

## 2. Configuración de Firebase

```javascript
// firebase.config.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAQ11SxxjJRrxEFiiCu7gOZnugUepPRG6A",
  authDomain: "edushuar.firebaseapp.com",
  projectId: "edushuar",
  storageBucket: "edushuar.firebasestorage.app",
  messagingSenderId: "630140877684",
  appId: "1:630140877684:web:ee53ee7192141a6755ca21"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
```

## 3. Arquitectura del Sistema

### 3.1 Estructura de Carpetas Angular 20

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── models/
│   ├── shared/
│   │   ├── components/
│   │   ├── directives/
│   │   ├── pipes/
│   │   └── utils/
│   ├── features/
│   │   ├── dictionary/
│   │   ├── stories/
│   │   ├── games/
│   │   ├── learning-modules/
│   │   ├── multimedia-archive/
│   │   ├── community/
│   │   └── profile/
│   ├── layouts/
│   └── assets/
├── environments/
└── assets/
    ├── images/
    ├── audio/
    ├── videos/
    └── icons/
```

## 4. Estructura de Base de Datos Firebase (Firestore)

### 4.1 Colección: users
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher' | 'elder' | 'moderator' | 'admin';
  ageGroup: 'child' | 'youth' | 'adult' | 'elder';
  location: {
    province: string;
    community: string;
  };
  preferences: {
    language: 'shuar' | 'spanish' | 'both';
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  progress: {
    completedLessons: string[];
    currentLevel: number;
    totalPoints: number;
  };
  createdAt: Timestamp;
  lastActive: Timestamp;
  isActive: boolean;
}
```

### 4.2 Colección: dictionary
```typescript
interface DictionaryEntry {
  id: string;
  shuarWord: string;
  spanishTranslation: string;
  englishTranslation?: string;
  category: string;
  subcategory?: string;
  pronunciation: {
    audioUrl: string;
    phoneticTranscription?: string;
  };
  images: string[];
  contextExamples: {
    shuar: string;
    spanish: string;
    audioUrl?: string;
  }[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  createdBy: string;
  reviewedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4.3 Colección: stories
```typescript
interface Story {
  id: string;
  title: {
    shuar: string;
    spanish: string;
  };
  content: {
    shuar: string;
    spanish: string;
  };
  narrator: {
    name: string;
    community: string;
    age: number;
  };
  audioFiles: {
    fullStory: string;
    segments: {
      startTime: number;
      endTime: number;
      text: string;
      audioUrl: string;
    }[];
  };
  images: string[];
  videos?: string[];
  category: 'myth' | 'legend' | 'folktale' | 'history' | 'educational';
  ageGroup: 'child' | 'youth' | 'adult' | 'all';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // en minutos
  tags: string[];
  culturalElements: string[];
  relatedStories: string[];
  createdBy: string;
  reviewedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  unlockLevel: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4.4 Colección: games
```typescript
interface Game {
  id: string;
  name: {
    shuar: string;
    spanish: string;
  };
  description: {
    shuar: string;
    spanish: string;
  };
  type: 'trivia' | 'puzzle' | 'memory' | 'word-match' | 'pronunciation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  ageGroup: 'child' | 'youth' | 'adult' | 'all';
  questions: GameQuestion[];
  culturalTheme: string;
  pointsReward: number;
  unlockLevel: number;
  estimatedTime: number; // en minutos
  instructions: {
    shuar: string;
    spanish: string;
  };
  createdBy: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface GameQuestion {
  id: string;
  question: {
    shuar: string;
    spanish: string;
  };
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'audio-match';
  options?: string[];
  correctAnswer: string | string[];
  audioUrl?: string;
  imageUrl?: string;
  points: number;
  explanation?: {
    shuar: string;
    spanish: string;
  };
}
```

### 4.5 Colección: learning-modules
```typescript
interface LearningModule {
  id: string;
  title: {
    shuar: string;
    spanish: string;
  };
  description: {
    shuar: string;
    spanish: string;
  };
  category: 'grammar' | 'vocabulary' | 'culture' | 'pronunciation' | 'ritual';
  level: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
  prerequisites: string[];
  estimatedDuration: number; // en horas
  objectives: {
    shuar: string[];
    spanish: string[];
  };
  createdBy: string;
  reviewedBy: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Lesson {
  id: string;
  title: {
    shuar: string;
    spanish: string;
  };
  content: {
    text: {
      shuar: string;
      spanish: string;
    };
    audioUrl?: string;
    videoUrl?: string;
    images?: string[];
  };
  exercises: Exercise[];
  order: number;
}

interface Exercise {
  id: string;
  type: 'listening' | 'speaking' | 'reading' | 'writing' | 'translation';
  question: {
    shuar: string;
    spanish: string;
  };
  correctAnswers: string[];
  hints?: {
    shuar: string;
    spanish: string;
  };
  audioUrl?: string;
  imageUrl?: string;
}
```

### 4.6 Colección: multimedia-archive
```typescript
interface MultimediaContent {
  id: string;
  title: {
    shuar: string;
    spanish: string;
  };
  description: {
    shuar: string;
    spanish: string;
  };
  type: 'video' | 'audio' | 'image' | 'document';
  category: 'medicine' | 'ritual' | 'agriculture' | 'cosmology' | 'history' | 'music' | 'dance';
  subcategory?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  transcript?: {
    shuar: string;
    spanish: string;
  };
  contributor: {
    name: string;
    role: string;
    community: string;
    age?: number;
  };
  culturalContext: {
    shuar: string;
    spanish: string;
  };
  tags: string[];
  duration?: number; // para audio/video en segundos
  fileSize: number;
  quality: 'low' | 'medium' | 'high';
  ageRestriction?: boolean;
  geolocation?: {
    latitude: number;
    longitude: number;
    placeName: string;
  };
  relatedContent: string[];
  createdBy: string;
  reviewedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  downloadCount: number;
  viewCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4.7 Colección: community-contributions
```typescript
interface CommunityContribution {
  id: string;
  contributorId: string;
  contributorInfo: {
    name: string;
    community: string;
    role: string;
  };
  contentType: 'story' | 'word' | 'song' | 'ritual' | 'recipe' | 'knowledge';
  title: {
    shuar: string;
    spanish: string;
  };
  content: {
    text?: {
      shuar: string;
      spanish: string;
    };
    audioUrl?: string;
    videoUrl?: string;
    images?: string[];
  };
  category: string;
  culturalRelevance: string;
  targetAudience: 'children' | 'youth' | 'adults' | 'all';
  moderation: {
    status: 'pending' | 'under-review' | 'approved' | 'rejected' | 'needs-changes';
    reviewedBy?: string;
    reviewComments?: string;
    culturalAccuracy: boolean;
    languageAccuracy: boolean;
    contentAppropriate: boolean;
  };
  submissionDate: Timestamp;
  reviewDate?: Timestamp;
  publishDate?: Timestamp;
}
```

### 4.8 Colección: user-progress
```typescript
interface UserProgress {
  id: string;
  userId: string;
  moduleId: string;
  lessonId?: string;
  gameId?: string;
  contentType: 'lesson' | 'game' | 'story' | 'exercise';
  completionStatus: 'not-started' | 'in-progress' | 'completed';
  score?: number;
  timeSpent: number; // en segundos
  attempts: number;
  lastActivity: Timestamp;
  streakDays: number;
  achievements: string[];
  notes?: string;
}
```

### 4.9 Colección: cultural-events
```typescript
interface CulturalEvent {
  id: string;
  name: {
    shuar: string;
    spanish: string;
  };
  description: {
    shuar: string;
    spanish: string;
  };
  type: 'ritual' | 'celebration' | 'ceremony' | 'festival' | 'workshop';
  date: Timestamp;
  location: {
    community: string;
    province: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  organizer: string;
  participants: string[];
  mediaContent: string[];
  isVirtual: boolean;
  registrationRequired: boolean;
  maxParticipants?: number;
  ageRestrictions?: string;
  culturalSignificance: {
    shuar: string;
    spanish: string;
  };
  relatedContent: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4.10 Colección: app-settings
```typescript
interface AppSettings {
  id: string;
  version: string;
  maintenanceMode: boolean;
  supportedLanguages: string[];
  offlineContentSync: {
    lastSyncDate: Timestamp;
    essentialContent: string[];
    maxOfflineSize: number; // en MB
  };
  culturalGuidelines: {
    shuar: string;
    spanish: string;
  };
  moderationRules: {
    autoApprovalRules: string[];
    flaggedKeywords: string[];
    reviewTimeLimit: number; // en horas
  };
  notifications: {
    enabled: boolean;
    types: string[];
    schedule: any;
  };
}
```

## 5. Requerimientos Funcionales Técnicos

### 5.1 Autenticación y Autorización
- **RF-001**: Implementar Firebase Authentication con roles de usuario
- **RF-002**: Sistema de perfiles por edad (niños, jóvenes, adultos, ancianos)
- **RF-003**: Control de acceso basado en roles (RBAC)
- **RF-004**: Autenticación social (Google, Facebook) opcional

### 5.2 Diccionario Audiovisual
- **RF-005**: Motor de búsqueda con filtros por categoría y dificultad
- **RF-006**: Reproducción de audio con controles de velocidad
- **RF-007**: Integración con Firebase Storage para multimedia
- **RF-008**: Sistema de favoritos y historial de búsqueda

### 5.3 Biblioteca Digital de Cuentos
- **RF-009**: Reproductor de audio sincronizado con texto
- **RF-010**: Sistema de desbloqueo progresivo por niveles
- **RF-011**: Subtítulos sincronizados en ambos idiomas
- **RF-012**: Marcadores de progreso de lectura/escucha

### 5.4 Módulos de Aprendizaje
- **RF-013**: Sistema de progreso gamificado con puntos
- **RF-014**: Ejercicios interactivos con retroalimentación inmediata
- **RF-015**: Seguimiento detallado del progreso del usuario
- **RF-016**: Sistema de certificados y logros

### 5.5 Juegos Educativos
- **RF-017**: Motor de juegos responsive para diferentes dispositivos
- **RF-018**: Sistema de puntuación y ranking
- **RF-019**: Generación dinámica de preguntas
- **RF-020**: Análisis de rendimiento por juego

### 5.6 Contribuciones Comunitarias
- **RF-021**: Upload de contenido multimedia desde dispositivos móviles
- **RF-022**: Workflow de moderación cultural
- **RF-023**: Sistema de notificaciones para moderadores
- **RF-024**: Versionado de contenido contribuido

## 6. Requerimientos No Funcionales Técnicos

### 6.1 Performance
- **RNF-001**: Tiempo de carga inicial < 3 segundos
- **RNF-002**: Tiempo de respuesta de navegación < 1 segundo
- **RNF-003**: Reproducción de audio sin latencia perceptible
- **RNF-004**: Carga lazy de imágenes y videos

### 6.2 Offline Capability
- **RNF-005**: Service Worker para funcionalidad offline
- **RNF-006**: Caché de contenido esencial (20% del total)
- **RNF-007**: Sincronización automática al recuperar conexión
- **RNF-008**: Indicadores claros de estado online/offline

### 6.3 Responsive Design
- **RNF-009**: Diseño mobile-first con TailwindCSS
- **RNF-010**: Soporte para pantallas desde 320px hasta 2560px
- **RNF-011**: Touch-friendly interface para dispositivos móviles
- **RNF-012**: Optimización para dispositivos de baja gama

### 6.4 Accesibilidad
- **RNF-013**: Cumplimiento WCAG 2.1 nivel AA
- **RNF-014**: Soporte para lectores de pantalla
- **RNF-015**: Navegación por teclado completa
- **RNF-016**: Alto contraste y texto escalable

### 6.5 Internacionalización
- **RNF-017**: Angular i18n para Shuar y Español
- **RNF-018**: Carga dinámica de traducciones
- **RNF-019**: Formateo de fechas y números por locale
- **RNF-020**: Dirección de texto RTL/LTR preparada

### 6.6 Seguridad
- **RNF-021**: Firestore Security Rules implementadas
- **RNF-022**: Validación de entrada en frontend y backend
- **RNF-023**: Sanitización de contenido generado por usuarios
- **RNF-024**: Rate limiting para uploads y contribuciones

### 6.7 Escalabilidad
- **RNF-025**: Arquitectura preparada para microservicios
- **RNF-026**: CDN para contenido multimedia
- **RNF-027**: Paginación para listas grandes
- **RNF-028**: Compresión de imágenes automática

## 7. Configuración de Desarrollo

### 7.1 Dependencias Principales
```json
{
  "@angular/core": "^20.0.0",
  "@angular/fire": "^18.0.0",
  "firebase": "^10.0.0",
  "tailwindcss": "^3.4.0",
  "@angular/service-worker": "^20.0.0",
  "rxjs": "^7.8.0",
  "@angular/cdk": "^20.0.0"
}
```

### 7.2 Scripts de Construcción
```json
{
  "scripts": {
    "build:prod": "ng build --configuration production",
    "build:staging": "ng build --configuration staging",
    "deploy:firebase": "firebase deploy",
    "serve:offline": "ng serve --service-worker",
    "test:e2e": "ng e2e",
    "analyze": "ng build --stats-json && npx webpack-bundle-analyzer"
  }
}
```

## 8. Plan de Implementación

### Fase 1 (4 semanas)
- Configuración del proyecto Angular 20
- Integración con Firebase
- Sistema de autenticación
- Estructura básica de navegación

### Fase 2 (6 semanas)
- Diccionario audiovisual
- Biblioteca de cuentos
- Sistema offline básico

### Fase 3 (6 semanas)
- Módulos de aprendizaje
- Juegos educativos
- Sistema de progreso

### Fase 4 (4 semanas)
- Contribuciones comunitarias
- Sistema de moderación
- Testing y optimización

### Fase 5 (2 semanas)
- Deployment
- Documentación
- Capacitación

## 9. Criterios de Aceptación

### 9.1 Funcionalidad Básica
- [ ] Usuario puede registrarse y iniciar sesión
- [ ] Búsqueda en diccionario funciona offline
- [ ] Audio se reproduce sin interrupciones
- [ ] Cuentos se desbloquean progresivamente
- [ ] Juegos registran puntuación correctamente

### 9.2 Performance
- [ ] PWA score > 90 en Lighthouse
- [ ] Funciona en redes 2G
- [ ] Carga inicial < 3 segundos
- [ ] Usa < 100MB de almacenamiento offline

### 9.3 Usabilidad
- [ ] Navegación intuitiva para niños y ancianos
- [ ] Diseño respeta elementos culturales Shuar
- [ ] Funciona en dispositivos Android básicos
- [ ] Textos legibles sin zoom

## 10. Métricas de Éxito

- **Adopción**: 1000+ usuarios activos en 6 meses
- **Engagement**: 20+ minutos promedio por sesión
- **Contenido**: 500+ palabras en diccionario
- **Comunidad**: 50+ contribuciones mensuales
- **Retención**: 60% usuarios activos después de 30 días

---

**Documento preparado por:** Equipo de Desarrollo EduShuar  
**Fecha:** Julio 2025  
**Versión:** 1.0