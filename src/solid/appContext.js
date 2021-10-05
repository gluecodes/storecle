import { createContext, useContext } from 'solid-js'

const AppContext = createContext()

export const AppProvider = AppContext.Provider
export const useAppContext = () => useContext(AppContext)
