/**
 * Sistema de traducciones simple para la aplicación
 */

export type Language = "es" | "en"

export const translations = {
  es: {
    // Navegación
    dashboard: "Dashboard",
    settings: "Configuración",
    help: "Ayuda",
    logout: "Cerrar sesión",
    
    // Configuración
    settingsTitle: "Configuración",
    settingsDescription: "Gestiona tus preferencias y datos de cuenta",
    userData: "Datos del Usuario",
    userDataDescription: "Información de tu cuenta",
    email: "Email",
    user: "Usuario",
    phone: "Teléfono",
    agency: "Agencia",
    nationality: "Nacionalidad",
    
    // Tema
    colorTheme: "Tema de Color",
    colorThemeDescription: "Elige entre tema claro u oscuro",
    darkMode: "Modo Oscuro",
    darkModeDescription: "Activa el tema oscuro para una mejor experiencia visual",
    
    // Idioma
    language: "Idioma",
    languageDescription: "Selecciona el idioma de la aplicación",
    appLanguage: "Idioma de la aplicación",
    languageDescriptionText: "El idioma se aplicará a toda la interfaz de la aplicación",
    
    // Notificaciones
    notifications: "Notificaciones",
    notificationsDescription: "Gestiona tus preferencias de notificaciones",
    enableNotifications: "Activar Notificaciones",
    notificationsDescriptionText: "Recibe alertas y actualizaciones importantes",
    
    // Cotizador
    newQuotation: "Nueva Cotización",
    quotationDescription: "Complete los datos del viaje para obtener las mejores opciones de asistencia.",
    destination: "Destino",
    selectDestination: "Seleccione destino",
    tripType: "Tipo de viaje",
    selectTripType: "Seleccione tipo",
    startDate: "Fecha de inicio",
    selectStartDate: "Seleccione fecha",
    endDate: "Fecha de fin",
    selectEndDate: "Seleccione fecha",
    passengers: "Pasajeros (edades)",
    add: "Agregar",
    quote: "Cotizar asistencia",
    quoting: "Cotizando...",
    
    // Resultados
    availablePlans: "planes disponibles",
    plan: "plan",
    plans: "planes",
    passenger: "pasajero",
    passengers: "pasajeros",
    day: "día",
    days: "días",
    maxCoverage: "Cobertura máxima",
    total: "total",
    perDayPerPerson: "/ día por persona",
    selectPlan: "Seleccionar plan",
    recommended: "Recomendado",
    back: "Volver",
    
    // Mensajes
    quotationSuccess: "Cotización realizada",
    quotationSuccessDescription: "Se han encontrado opciones de asistencia",
    quotationError: "Error al cotizar",
    loginSuccess: "¡Bienvenido a Biant!",
    loginSuccessDescription: "Inicio de sesión exitoso",
    loginError: "Error al iniciar sesión",
    incorrectCredentials: "Credenciales incorrectas",
    incorrectCredentialsDescription: "Por favor verifica tu nombre de usuario y contraseña",
    logoutSuccess: "Sesión cerrada",
    logoutSuccessDescription: "Has cerrado sesión correctamente",
    logoutError: "Error al cerrar sesión",
    
    // Validaciones
    selectDestinationError: "Seleccione un destino",
    selectTripTypeError: "Seleccione el tipo de viaje",
    selectStartDateError: "Seleccione fecha de inicio",
    selectEndDateError: "Seleccione fecha de fin",
    endDateBeforeStartError: "La fecha de fin debe ser posterior a la de inicio",
    passengersError: "Las edades deben estar entre 0 y 120",
    atLeastOnePassenger: "Debe haber al menos un pasajero",
    
    // Header
    quotationAssistant: "Cotizador de Asistencia al Viajero",
    myProfile: "Mi Perfil",
    role: "Rol",
    
    // Login
    login: "Iniciar Sesión",
    username: "Nombre de Usuario",
    password: "Contraseña",
    forgotPassword: "¿Olvidaste tu contraseña?",
    loginButton: "Iniciar sesión",
    loggingIn: "Iniciando sesión...",
    agencyPortal: "Portal de Agentes",
    enterCredentials: "Ingresá tus credenciales para acceder",
  },
  en: {
    // Navigation
    dashboard: "Dashboard",
    settings: "Settings",
    help: "Help",
    logout: "Logout",
    
    // Settings
    settingsTitle: "Settings",
    settingsDescription: "Manage your preferences and account data",
    userData: "User Data",
    userDataDescription: "Your account information",
    email: "Email",
    user: "User",
    phone: "Phone",
    agency: "Agency",
    nationality: "Nationality",
    
    // Theme
    colorTheme: "Color Theme",
    colorThemeDescription: "Choose between light or dark theme",
    darkMode: "Dark Mode",
    darkModeDescription: "Enable dark theme for a better visual experience",
    
    // Language
    language: "Language",
    languageDescription: "Select the application language",
    appLanguage: "Application language",
    languageDescriptionText: "The language will be applied to the entire application interface",
    
    // Notifications
    notifications: "Notifications",
    notificationsDescription: "Manage your notification preferences",
    enableNotifications: "Enable Notifications",
    notificationsDescriptionText: "Receive alerts and important updates",
    
    // Quotation
    newQuotation: "New Quotation",
    quotationDescription: "Complete the trip details to get the best assistance options.",
    destination: "Destination",
    selectDestination: "Select destination",
    tripType: "Trip Type",
    selectTripType: "Select type",
    startDate: "Start Date",
    selectStartDate: "Select date",
    endDate: "End Date",
    selectEndDate: "Select date",
    passengers: "Passengers (ages)",
    add: "Add",
    quote: "Quote assistance",
    quoting: "Quoting...",
    
    // Results
    availablePlans: "plans available",
    plan: "plan",
    plans: "plans",
    passenger: "passenger",
    passengers: "passengers",
    day: "day",
    days: "days",
    maxCoverage: "Maximum coverage",
    total: "total",
    perDayPerPerson: "/ day per person",
    selectPlan: "Select plan",
    recommended: "Recommended",
    back: "Back",
    
    // Messages
    quotationSuccess: "Quotation completed",
    quotationSuccessDescription: "Assistance options have been found",
    quotationError: "Error quoting",
    loginSuccess: "Welcome to Biant!",
    loginSuccessDescription: "Successful login",
    loginError: "Login error",
    incorrectCredentials: "Incorrect credentials",
    incorrectCredentialsDescription: "Please verify your username and password",
    logoutSuccess: "Session closed",
    logoutSuccessDescription: "You have successfully logged out",
    logoutError: "Error logging out",
    
    // Validations
    selectDestinationError: "Select a destination",
    selectTripTypeError: "Select the trip type",
    selectStartDateError: "Select start date",
    selectEndDateError: "Select end date",
    endDateBeforeStartError: "End date must be after start date",
    passengersError: "Ages must be between 0 and 120",
    atLeastOnePassenger: "There must be at least one passenger",
    
    // Header
    quotationAssistant: "Travel Assistance Quoter",
    myProfile: "My Profile",
    role: "Role",
    
    // Login
    login: "Sign In",
    username: "Username",
    password: "Password",
    forgotPassword: "Forgot your password?",
    loginButton: "Sign in",
    loggingIn: "Signing in...",
    agencyPortal: "Agency Portal",
    enterCredentials: "Enter your credentials to access",
  },
} as const

export function getTranslation(lang: Language, key: keyof typeof translations.es): string {
  return translations[lang][key] || translations.es[key]
}

