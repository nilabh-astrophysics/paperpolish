export default function Landing() {
  return (
    <main className="p-10 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold">PaperPolish</h1>
      <p className="mt-4 text-lg text-gray-600">
        Effortless LaTeX formatting for journals, theses, and research papers.
      </p>
      <a href="/upload" className="inline-block mt-6 px-4 py-2 rounded bg-black text-white">
        Try the Beta
      </a>
    </main>
  );
}
