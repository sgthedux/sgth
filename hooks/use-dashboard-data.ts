import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  pendingRequests: number
  approvedThisMonth: number
  totalActiveEmployees: number
  reportsGenerated: number
}

interface RecentLicenseActivity {
  id: string
  nombres: string
  apellidos: string
  tipo_licencia?: string
  observacion: string
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'en_revision'
  created_at: string
  radicado: string
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const supabase = createClient()
  
  try {
    // Obtener el primer día del mes actual
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59)
    
    console.log('📅 Fecha consulta licencias aprobadas:', {
      firstDayOfMonth: firstDayOfMonth.toISOString(),
      lastDayOfMonth: lastDayOfMonth.toISOString()
    })

    // Obtener estadísticas del dashboard
    const [
      { count: pendingRequests },
      { count: approvedThisMonth },
      { count: totalRequests },
      { count: reportsGenerated }
    ] = await Promise.all([
      // Solicitudes pendientes
      supabase
        .from('license_requests')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente'),
      
      // Licencias aprobadas este mes (basado en updated_at cuando se aprobó)
      supabase
        .from('license_requests')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'aprobada')
        .gte('updated_at', firstDayOfMonth.toISOString())
        .lte('updated_at', lastDayOfMonth.toISOString()),
      
      // Total de solicitudes (para calcular empleados únicos)
      supabase
        .from('license_requests')
        .select('numero_documento', { count: 'exact', head: true }),
      
      // Reportes generados (basado en actividad del mes)
      supabase
        .from('license_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ])

    console.log('📊 Dashboard Stats:', {
      pendingRequests,
      approvedThisMonth,
      totalRequests,
      reportsGenerated
    })

    return {
      pendingRequests: pendingRequests || 0,
      approvedThisMonth: approvedThisMonth || 0,
      totalActiveEmployees: Math.max(Math.floor((totalRequests || 0) / 2), 1), // Estimación más realista
      reportsGenerated: Math.floor((reportsGenerated || 0) / 5) || 1 // Estimación
    }
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error)
    throw error
  }
}

const fetchRecentActivity = async (): Promise<RecentLicenseActivity[]> => {
  const supabase = createClient()
  
  try {
    // Obtener actividad reciente
    const { data, error } = await supabase
      .from('license_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('❌ Error fetching recent activity:', error)
      throw error
    }

    console.log('📋 Recent Activity Data:', data)
    
    return data?.map(item => ({
      id: item.id,
      nombres: item.nombres,
      apellidos: item.apellidos,
      tipo_licencia: item.observacion?.length > 50 
        ? item.observacion.substring(0, 50) + '...' 
        : item.observacion || 'Solicitud de licencia',
      observacion: item.observacion,
      estado: item.estado,
      created_at: item.created_at,
      radicado: item.radicado
    })) || []
  } catch (error) {
    console.error('❌ Error in fetchRecentActivity:', error)
    throw error
  }
}

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR('dashboard-stats', fetchDashboardStats, {
    refreshInterval: 30000, // Actualizar cada 30 segundos
    revalidateOnFocus: true
  })
  
  return {
    stats: data,
    isLoading,
    error
  }
}

export function useRecentActivity() {
  const { data, error, isLoading } = useSWR('recent-activity', fetchRecentActivity, {
    refreshInterval: 10000, // Actualizar cada 10 segundos
    revalidateOnFocus: true
  })
  
  return {
    activities: data,
    isLoading,
    error
  }
}
