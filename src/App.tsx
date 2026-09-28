import { CurrencyConverter } from './components/CurrencyConverter'

const App = () => {
  return (
    <>
      <main className="flex min-h-svh justify-center bg-muted/40 px-4 py-10 sm:items-center">
        <div className="w-full max-w-xl space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Currency Converter
            </h1>
          </header>
          <CurrencyConverter />
        </div>
      </main>
    </>
  )
}

export default App
