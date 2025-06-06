
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';

import './App.css';
import { ThemeProvider } from "./components/theme/theme-provider";
import { Toaster } from "./components/ui/toaster";

import Index from './pages/Index';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import QuickSignUp from './pages/QuickSignUp';
import Onboarding from './pages/onboarding/Onboarding';  // Changed to use the onboarding folder version
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import ProfilePhotosPage from './pages/ProfilePhotosPage';
import ProfileExamsPage from './pages/ProfileExamsPage';
import BodyMeasurementsPage from './pages/BodyMeasurementsPage';
import MealPlanPage from './pages/MealPlanPage';
import MealTrackingPage from './pages/MealTrackingPage';
import MealHistoryPage from './pages/MealHistoryPage';
import EmotionalSupport from './pages/EmotionalSupport';
import ExercisePage from "./pages/ExercisePage";
import ProgressPage from './pages/ProgressPage';
import EpigeneticAssessment from './pages/EpigeneticAssessment';
import SupplementsPage from './pages/SupplementsPage';
import MedicalExamsPage from './pages/MedicalExamsPage';
import AdminDashboard from './pages/AdminDashboard';
import BannerAdmin from './pages/BannerAdmin';
import WaterIntakeHistoryPage from './pages/WaterIntakeHistory';
import FoodAnalysisPage from "./pages/FoodAnalysisPage";
import HistoryPage from "./pages/HistoryPage";
import NotFound from './pages/NotFound';
import ShowUserId from './show-user-id';
import ProgressAnalytics from './pages/ProgressAnalytics';
import AdherenceMetricsPage from './pages/AdherenceMetricsPage';
import AdminReferenceLibraryPage from './pages/AdminReferenceLibraryPage';
import EnhancedAdminReferencePage from './pages/EnhancedAdminReferencePage';
import { AuthProvider } from './components/auth/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useEffect } from 'react';
import { ensureProfileColumns } from './utils/profileMigration';
import { NutritionProvider } from './contexts/NutritionContext';
import { checkAndRequestWaterIntakeReset } from './services/waterIntakeResetService';
import { applyAllMigrations } from './utils/applyDatabaseMigrations';

function App() {
  useEffect(() => {
    // Run profile migrations and daily resets on app startup
    const initializeApp = async () => {
      try {
        // Aplicar migrações SQL necessárias (criação de tabelas e funções)
        console.log('Aplicando migrações SQL...');
        await applyAllMigrations();
        console.log('Migrações SQL aplicadas com sucesso!');
        
        // Verificar colunas do perfil
        await ensureProfileColumns();
        
        // Verificar se é necessário resetar os dados de hidratação
        console.log('Verificando necessidade de reset de hidratação...');
        const resetPerformed = await checkAndRequestWaterIntakeReset();
        if (resetPerformed) {
          console.log('Reset diário de hidratação realizado com sucesso');
        } else {
          console.log('Nenhum reset de hidratação necessário');
        }
      } catch (error) {
        console.error('Erro durante a inicialização do app:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <NutritionProvider>
            <Router>
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/cadastro-rapido" element={<QuickSignUp />} />
              
              {/* Protected routes */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/history" element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/profile/photos" element={
                <ProtectedRoute>
                  <ProfilePhotosPage />
                </ProtectedRoute>
              } />
              {/* Rota alternativa para fotos de progresso */}
              <Route path="/progress-photos" element={
                <ProtectedRoute>
                  <ProfilePhotosPage />
                </ProtectedRoute>
              } />
              <Route path="/profile/exams" element={
                <ProtectedRoute>
                  <ProfileExamsPage />
                </ProtectedRoute>
              } />
              <Route path="/body-measurements" element={
                <ProtectedRoute>
                  <BodyMeasurementsPage />
                </ProtectedRoute>
              } />
              <Route path="/meal-plan" element={
                <ProtectedRoute>
                  <MealPlanPage />
                </ProtectedRoute>
              } />
              <Route path="/meal-tracking" element={
                <ProtectedRoute>
                  <MealTrackingPage />
                </ProtectedRoute>
              } />
              <Route path="/exercise" element={
                <ProtectedRoute>
                  <ExercisePage />
                </ProtectedRoute>
              } />
              <Route path="/emotional-support" element={
                <ProtectedRoute>
                  <EmotionalSupport />
                </ProtectedRoute>
              } />
              <Route path="/progress" element={
                <ProtectedRoute>
                  <ProgressPage />
                </ProtectedRoute>
              } />
              <Route path="/progress-analytics" element={
                <ProtectedRoute>
                  <ProgressAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/adherence-metrics" element={
                <ProtectedRoute>
                  <AdherenceMetricsPage />
                </ProtectedRoute>
              } />
              <Route path="/epigenetic-assessment" element={
                <ProtectedRoute>
                  <EpigeneticAssessment />
                </ProtectedRoute>
              } />
              <Route path="/supplements" element={
                <ProtectedRoute>
                  <SupplementsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/banner-admin" element={
                <ProtectedRoute>
                  <BannerAdmin />
                </ProtectedRoute>
              } />
              
              {/* Rota da biblioteca de referência administrativa */}
              <Route path="/admin/reference-library" element={
                <ProtectedRoute>
                  <AdminReferenceLibraryPage />
                </ProtectedRoute>
              } />
              
              {/* Rotas aprimoradas para gerenciamento de materiais de referência - com alternativas para facilitar acesso */}
              <Route path="/admin/enhanced-references" element={
                <ProtectedRoute>
                  <EnhancedAdminReferencePage />
                </ProtectedRoute>
              } />
              <Route path="/references-admin" element={
                <ProtectedRoute>
                  <EnhancedAdminReferencePage />
                </ProtectedRoute>
              } />
              <Route path="/biblioteca-admin" element={
                <ProtectedRoute>
                  <EnhancedAdminReferencePage />
                </ProtectedRoute>
              } />
              
              {/* Página de histórico de refeições */}
              <Route path="/meal-history" element={
                <ProtectedRoute>
                  <MealHistoryPage />
                </ProtectedRoute>
              } />

              {/* Análise de Alimentos com IA - rotas públicas para facilitar o acesso */}
              <Route path="/analise-alimentos" element={<FoodAnalysisPage />} />
              <Route path="/food-analysis" element={<FoodAnalysisPage />} />
              
              {/* Página de histórico de hidratação */}
              <Route path="/water-history" element={
                <ProtectedRoute>
                  <WaterIntakeHistoryPage />
                </ProtectedRoute>
              } />
              
              {/* Nova página de análise de exames médicos */}
              <Route path="/exames-medicos" element={<MedicalExamsPage />} />
              <Route path="/medical-exams" element={<MedicalExamsPage />} />
              
              {/* Rota temporária para ver ID do usuário (para admin) */}
              <Route path="/my-user-id" element={
                <ProtectedRoute>
                  <ShowUserId />
                </ProtectedRoute>
              } />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </NutritionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
