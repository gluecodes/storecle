import { createContext, useContext } from 'react'

export const AppContext = createContext()
export const AppProvider = AppContext.Provider
export const useAppContext = () => useContext(AppContext)
