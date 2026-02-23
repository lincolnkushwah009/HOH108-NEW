import { createContext, useContext, useState, useEffect } from 'react'
import { companiesAPI } from '../utils/api'
import { useAuth } from './AuthContext'

const CompanyContext = createContext(null)

// Special value for "All Companies" option
export const ALL_COMPANIES = { _id: 'all', name: 'All Companies', code: 'ALL' }

export const CompanyProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [companies, setCompanies] = useState([])
  const [activeCompany, setActiveCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is super admin (can see all companies)
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin'

  useEffect(() => {
    if (isAuthenticated) {
      loadCompanies()
    } else {
      setCompanies([])
      setActiveCompany(null)
      setLoading(false)
    }
  }, [isAuthenticated])

  const loadCompanies = async () => {
    try {
      const response = await companiesAPI.getAll()
      const companyList = response.data || []
      setCompanies(companyList)

      // Set active company from localStorage or user's primary company
      const savedCompanyId = localStorage.getItem('hoh108_active_company')

      if (savedCompanyId === 'all' && isSuperAdmin) {
        // Super admin viewing all companies
        setActiveCompany(ALL_COMPANIES)
      } else if (savedCompanyId && companyList.find(c => c._id === savedCompanyId)) {
        setActiveCompany(companyList.find(c => c._id === savedCompanyId))
      } else if (companyList.length > 0) {
        setActiveCompany(companyList[0])
        localStorage.setItem('hoh108_active_company', companyList[0]._id)
      }
    } catch (err) {
      console.error('Failed to load companies:', err)
    } finally {
      setLoading(false)
    }
  }

  const switchCompany = (companyId) => {
    if (companyId === 'all' && isSuperAdmin) {
      setActiveCompany(ALL_COMPANIES)
      localStorage.setItem('hoh108_active_company', 'all')
    } else {
      const company = companies.find(c => c._id === companyId)
      if (company) {
        setActiveCompany(company)
        localStorage.setItem('hoh108_active_company', companyId)
      }
    }
  }

  // Get the company ID to send to API (null for "all")
  const getActiveCompanyId = () => {
    if (activeCompany?._id === 'all') {
      return 'all'
    }
    return activeCompany?._id || null
  }

  // Check if viewing all companies
  const isViewingAllCompanies = activeCompany?._id === 'all'

  const value = {
    companies,
    activeCompany,
    loading,
    switchCompany,
    reload: loadCompanies,
    isSuperAdmin,
    isViewingAllCompanies,
    getActiveCompanyId,
  }

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

export const useCompany = () => {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}

export default CompanyContext
