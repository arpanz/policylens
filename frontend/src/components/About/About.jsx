const cards = [
  {
    icon: '🧠',
    title: 'Intelligent Parsing',
    desc: 'Understands dense legal and policy language across formats — PDFs, DOCX, and scanned documents.',
  },
  {
    icon: '⚡',
    title: 'Instant Summaries',
    desc: 'Receive concise, structured breakdowns the moment a document is uploaded. Zero waiting.',
  },
  {
    icon: '🔍',
    title: 'Clause Extraction',
    desc: 'Pinpoints key clauses, obligations, deadlines, and risk terms automatically.',
  },
  {
    icon: '🛡️',
    title: 'Compliance Guard',
    desc: 'Flags potential regulatory conflicts and compliance gaps before they become liabilities.',
  },
]

export default function About() {
  return (
    <section id="about" className="py-28 bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-150 h-100 bg-purple-950/40 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block bg-purple-950/70 border border-purple-700/40 text-purple-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-5">
            What We Do
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
            Built for People Who{' '}
            <span className="text-purple-400">Can't Afford</span>
            <br />to Miss the Fine Print
          </h2>
          <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            PolicyLens AI is purpose-built for professionals who work with high-stakes documents every day.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="group bg-gray-950 border border-purple-900/30 hover:border-purple-600/60 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/30 cursor-default"
            >
              <div className="w-12 h-12 bg-purple-950 rounded-xl flex items-center justify-center text-2xl mb-5 border border-purple-800/40 group-hover:border-purple-600/60 transition-colors duration-300">
                {icon}
              </div>
              <h3 className="text-white font-bold text-base mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              <div className="mt-5 h-px bg-linear-to-r from-purple-600/0 via-purple-600/60 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        {/* Audience strip */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ['🎓', 'Students'],
            ['🔬', 'Researchers'],
            ['⚖️', 'Legal Teams'],
            ['🏛️', 'Policymakers'],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-3 bg-gray-950/80 border border-purple-900/30 rounded-xl px-4 py-3">
              <span className="text-xl">{icon}</span>
              <span className="text-gray-300 font-semibold text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
