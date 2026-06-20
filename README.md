# SVRR Meeting Management System

A comprehensive meeting and ticket management system built with React and Node.js, featuring role-based access control, real-time notifications, and modern UI/UX.

## 🚀 Features

### Meeting Management
- **Create & Schedule Meetings**: Full-featured meeting creation with participants, locations, and file attachments
- **Calendar Integration**: Visual calendar view with FullCalendar integration
- **Role-based Access**: Different permissions for admin, manager, supervisor, and regular users
- **Email Notifications**: Automatic email invitations to meeting participants
- **File Attachments**: Support for PDF, DOC, DOCX, XLS, XLSX, TXT, and image files
- **Real-time Updates**: WebSocket integration for live updates

### Ticket Management
- **Comprehensive Ticketing**: Create, assign, and track support tickets
- **Department Management**: Organize tickets by departments
- **Status Tracking**: Track ticket progress from creation to resolution
- **File Attachments**: Attach relevant files to tickets
- **Reporting**: Generate detailed reports and analytics

### User Management
- **Multi-role System**: Admin, Manager, Supervisor, GM, and User roles
- **Department Organization**: Users organized by departments
- **Profile Management**: User profile editing and management
- **Authentication**: Secure JWT-based authentication

### Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Theme**: Customizable theme support
- **Toast Notifications**: User-friendly notification system
- **Error Handling**: Comprehensive error boundaries and validation
- **Loading States**: Smooth loading indicators throughout the app

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **FullCalendar** - Calendar component for meeting scheduling
- **React Dropzone** - File upload handling
- **Axios** - HTTP client for API calls
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Multer** - File upload handling
- **Nodemailer** - Email service
- **Socket.io** - Real-time communication
- **Web Push** - Push notifications

## 📦 Installation

### Prerequisites
- Node.js (>= 20.0.0)
- PostgreSQL
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `server` directory (see production example below):
```env
NODE_ENV=production
PORT=5000
HTTPS=false
FRONTEND_URL=https://your-frontend.example.com

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DATABASE=sv_meeting

JWT_SECRET=change_me_to_long_random
JWT_EXPIRES_IN=24h

SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=mailer@example.com
SMTP_PASS=your_smtp_password
SMTP_FROM=SV Meeting <mailer@example.com>

MEETINGS_ONLY=true
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `frontend` directory:
```env
REACT_APP_SERVER_IP=https://your-api.example.com/
```

4. Start the development server:
```bash
npm start
```

## 🗄️ Database Schema

### Key Tables
- **users** - User accounts and profiles
- **departments** - Organizational departments
- **meetings** - Meeting information
- **meeting_participants** - Meeting participant relationships
- **meeting_files** - Attached meeting files
- **ticket** - Support tickets
- **messages** - Ticket messages and comments
- **locations** - Meeting locations

## 🔐 Security Features

- **Input Validation**: Comprehensive validation and sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization and CSP headers
- **Authentication**: JWT-based secure authentication
- **Authorization**: Role-based access control
- **File Upload Security**: File type and size validation

## 🚀 Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Reduced initial bundle size
- **Parallel API Calls**: Optimized data fetching
- **Error Boundaries**: Graceful error handling
- **Loading States**: Better user experience

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🔧 Development

### Available Scripts

#### Frontend
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run dev` - Start with custom host

#### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run dev:https` - Start with HTTPS
- PM2: `pm2 start ecosystem.config.js`

### Code Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-specific components
│   │   ├── meetings/       # Meeting-related components
│   │   └── common/         # Shared components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── Routes/             # Page components
│   └── services/           # API services

server/
├── src/
│   ├── auth.js            # Authentication middleware
│   ├── meetings.js        # Meeting routes
│   ├── tickets.js         # Ticket routes
│   ├── user.js            # User routes
│   └── db.js              # Database configuration
```

## 🧪 Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests
cd server
npm test
```

## 📈 Monitoring & Analytics

- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Loading time tracking
- **User Analytics**: Meeting and ticket statistics
- **Push Notifications**: Real-time user engagement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the user guide in the application

## 🔄 Recent Updates

### v1.0.12
- ✅ Enhanced error handling with error boundaries
- ✅ Improved performance with lazy loading
- ✅ Added comprehensive input validation
- ✅ Implemented toast notification system
- ✅ Better loading states and UX
- ✅ Security improvements with input sanitization
- ✅ Code quality improvements

---

**Built with ❤️ for efficient meeting and ticket management**

