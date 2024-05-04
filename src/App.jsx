
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { lightTheme, darkTheme } from './styles/theme'
import { Provider } from 'react-redux'
import {GlobalWrapper} from './wrappers/GlobalWrapper'
import Notification from './components/common/Notification/Notification'
import { store } from './globalState/store'
import {FeeUpdater} from './pages/Updaters/FeeUpdater'

function App() {
    console.log('App');
    const themeColor = window._qdnTheme
    return (
        <Provider store={store}>
            <ThemeProvider theme={themeColor === 'light' ? lightTheme : darkTheme}>
                <Notification />
                <GlobalWrapper>
                    <CssBaseline />
                    <Routes>
                        <Route path="/" element={<FeeUpdater />} />
                    </Routes>
                </GlobalWrapper>
            </ThemeProvider>
        </Provider>
    )
}

export default App
