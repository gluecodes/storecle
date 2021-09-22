import { createContext, useContext } from 'solid-js'

export const AppContext = createContext()
export const AppProvider = AppContext.Provider
export const useAppContext = () => useContext(AppContext)
