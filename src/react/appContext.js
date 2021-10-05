import { createContext, useContext } from 'react'

const AppContext = createContext()

export const AppProvider = AppContext.Provider
export const useAppContext = () => useContext(AppContext)
