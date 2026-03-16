export default function Footer() {
  const guidelines = [
    {
      title: "Data Security",
      desc: "All uploaded documents are encrypted and purged post-analysis."
    },
    {
      title: "Acceptable Use",
      desc: "Users must possess legal rights to the documents they analyze."
    },
    {
      title: "AI Limitations",
      desc: "Insights are AI-assisted and do not constitute formal legal advice."
    }
  ];

  return (
    <footer id="contact" className="font-footer bg-gray-50 dark:bg-[#080605] border-t border-gray-200 dark:border-cyan-900/20 pt-16 pb-8 transition-colors duration-400 relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {guidelines.map((item, index) => (
            <div key={index} className="bg-white dark:bg-[#120e0c] p-6 rounded-2xl border border-gray-200 dark:border-cyan-900/20 transition-colors duration-400 shadow-sm dark:shadow-none">
              <h4 className="text-gray-900 dark:text-cyan-50 font-bold mb-2">{item.title}</h4>
              <p className="text-gray-600 dark:text-cyan-100/60 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-200 dark:border-cyan-900/20">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <span className="text-gray-900 dark:text-cyan-50 font-bold tracking-tight text-sm uppercase">PolicyLens</span>
          </div>
          
          <p className="text-gray-500 dark:text-cyan-100/40 text-sm font-medium">
            © 2026 PolicyLens AI. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}