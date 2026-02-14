import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[url('/logo.png')] bg-center bg-no-repeat opacity-5 scale-150" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <Image
            src="/logo.png"
            alt="Logo"
            width={150}
            height={75}
            className="object-contain"
          />
          <div className="flex gap-4">
            <Link
              href="/login"
              className="text-white/80 hover:text-white font-medium transition-colors"
            >
              Přihlášení
            </Link>
            <Link
              href="/register"
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl font-medium transition-all backdrop-blur-sm border border-white/20"
            >
              Registrace
            </Link>
          </div>
        </header>

        {/* Hero section */}
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="Logo"
              width={280}
              height={140}
              className="mx-auto"
            />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Profesionální nástroj
            <br />
            <span className="text-primary-200">pro kondiční trenéry</span>
          </h1>

          <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Spravujte cviky, vytvářejte tréninkové plány a sdílejte je s vašimi klienty.
            Vše na jednom místě.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group bg-white text-primary-700 hover:bg-primary-50 px-8 py-4 rounded-xl text-lg font-semibold shadow-kometa-lg transition-all duration-300 hover:scale-105"
            >
              Začít zdarma
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold backdrop-blur-sm border-2 border-white/30 hover:border-white/50 transition-all duration-300"
            >
              Přihlásit se
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-all duration-300 hover:scale-105 group">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2M9 12h6m-3-3v6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Databáze cviků
            </h3>
            <p className="text-primary-100 leading-relaxed">
              Vytvářejte vlastní databázi cviků s YouTube videi a podrobným popisem. Import z YouTube kanálů.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-all duration-300 hover:scale-105 group">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Tréninkové plány
            </h3>
            <p className="text-primary-100 leading-relaxed">
              Sestavujte tréninkové plány z vašich cviků s nastavením sérií, opakování a pauz.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:bg-white/15 transition-all duration-300 hover:scale-105 group">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Sdílení s klienty
            </h3>
            <p className="text-primary-100 leading-relaxed">
              Přiřazujte plány klientům, kteří je mohou sledovat ve své vlastní aplikaci.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 text-center text-primary-200 text-sm">
          <p>© 2024 Fitness Trainer App. Všechna práva vyhrazena.</p>
        </footer>
      </div>
    </div>
  )
}
