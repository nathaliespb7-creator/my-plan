import { BottomNav } from './components/BottomNav'
import { StartDateModal } from './components/StartDateModal'
import { AppProvider, useApp } from './context/AppContext'
import { PlanScreen } from './screens/PlanScreen'
import { ProgressScreen } from './screens/ProgressScreen'
import { TodayScreen } from './screens/TodayScreen'
import { WeekScreen } from './screens/WeekScreen'

function Shell() {
  const { tab } = useApp()

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-24 pt-4">
      {tab === 'today' && <TodayScreen />}
      {tab === 'week' && <WeekScreen />}
      {tab === 'progress' && <ProgressScreen />}
      {tab === 'plan' && <PlanScreen />}
      <BottomNav />
      <StartDateModal />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
