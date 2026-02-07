import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Fitness Trainer App
          </h1>
          <p className="text-xl text-primary-100 mb-12">
            Profesionální nástroj pro kondiční trenéry. Spravujte cviky,
            vytvářejte tréninkové plány a sdílejte je s klienty.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="btn bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg"
            >
              Přihlásit se
            </Link>
            <Link
              href="/register"
              className="btn bg-primary-500 text-white hover:bg-primary-400 border-2 border-white px-8 py-3 text-lg"
            >
              Registrovat se
            </Link>
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-4xl mb-4">🏋️</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Databáze cviků
              </h3>
              <p className="text-primary-100">
                Vytvářejte vlastní databázi cviků s YouTube videi a podrobným
                popisem.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Tréninkové plány
              </h3>
              <p className="text-primary-100">
                Sestavujte tréninkové plány z vašich cviků s nastavením sérií a
                opakování.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Sdílení s klienty
              </h3>
              <p className="text-primary-100">
                Přiřazujte plány klientům, kteří je mohou sledovat ve své
                aplikaci.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
