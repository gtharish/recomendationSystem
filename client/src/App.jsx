import { useState } from 'react';
import products from './products.js';

const API_URL = import.meta.env.VITE_API_URL || '';
const suggestions = [
  'A laptop under ₹60,000 with 16GB RAM',
  'A phone with a great camera under ₹40,000',
  'Noise-cancelling headphones for travel',
];

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}

function App() {
  const [preference, setPreference] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function getRecommendations(event) {
    event.preventDefault();
    const trimmedPreference = preference.trim();

    if (!trimmedPreference) {
      setError('Tell us a little about what you’re looking for first.');
      setRecommendedProducts(null);
      return;
    }

    setIsLoading(true);
    setError('');
    setRecommendedProducts(null);

    try {
      const response = await fetch(`${API_URL}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preference: trimmedPreference, products }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Recommendations could not be loaded. Please try again.');
      }

      if (!Array.isArray(data.recommendedProductIds)) {
        throw new Error('We received an unexpected response. Please try again.');
      }

      const recommendedIds = new Set(data.recommendedProductIds);
      setRecommendedProducts(products.filter((product) => recommendedIds.has(product.id)));
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas px-5 pb-20 pt-10 text-ink sm:px-8 sm:pt-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-leaf text-lg text-white" aria-hidden="true">
            g
          </div>
          <span className="text-lg font-semibold tracking-tight">goodfind</span>
          <span className="ml-auto rounded-full border border-[#dce5df] bg-white px-3 py-1 text-xs font-medium text-muted">
            Thoughtful picks, made simple
          </span>
        </header>

        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-leaf">Your personal product guide</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
            Find the right thing.
            <span className="block text-leaf">Skip the endless search.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Tell us what matters to you. We’ll find the best match from a handpicked list of products.
          </p>

          <form onSubmit={getRecommendations} className="mt-9 rounded-3xl border border-[#e3e8e4] bg-white p-3 text-left shadow-card sm:p-4">
            <label htmlFor="preference" className="sr-only">Describe what you’re looking for</label>
            <textarea
              id="preference"
              rows="3"
              maxLength={1000}
              value={preference}
              onChange={(event) => setPreference(event.target.value)}
              placeholder="I need a laptop under ₹60,000 with 16GB RAM and good battery life…"
              className="w-full resize-none rounded-2xl border-0 bg-transparent px-3 py-3 text-base leading-7 text-ink outline-none placeholder:text-[#9aa59e] focus:ring-0"
            />
            <div className="flex flex-col gap-3 border-t border-[#edf0ed] px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="px-1 text-xs text-muted">Be as specific as you like</span>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-leaf px-5 text-sm font-semibold text-white transition hover:bg-[#20583f] focus:outline-none focus:ring-2 focus:ring-leaf focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
              >
                {isLoading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Finding your picks…</>
                ) : (
                  <>Find my match <span aria-hidden="true">→</span></>
                )}
              </button>
            </div>
          </form>

          {!recommendedProducts && !isLoading && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="mr-1 text-xs text-muted">Try:</span>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => { setPreference(suggestion); setError(''); }}
                  className="rounded-full border border-[#e1e7e2] bg-white px-3 py-1.5 text-xs text-[#526158] transition hover:border-leaf hover:text-leaf"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-800">
              {error}
            </p>
          )}
        </section>

        {recommendedProducts && (
          <section className="mt-16" aria-live="polite">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">Picked for you</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Your recommendations</h2>
              </div>
              <span className="pb-1 text-sm text-muted">{recommendedProducts.length} {recommendedProducts.length === 1 ? 'match' : 'matches'}</span>
            </div>

            {recommendedProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#d7dfd9] bg-white/70 px-6 py-12 text-center">
                <p className="text-base font-medium">No close matches yet</p>
                <p className="mt-2 text-sm text-muted">Try widening your budget or describing a different category.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendedProducts.map((product) => (
                  <article key={product.id} className="flex h-full flex-col rounded-3xl border border-[#e3e8e4] bg-white p-5 shadow-card">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="rounded-full bg-[#edf4ef] px-3 py-1 text-xs font-medium text-leaf">{product.category}</span>
                      <span className="text-sm font-semibold text-ink">{formatPrice(product.price)}</span>
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
                    <p className="mt-2 min-h-[3rem] text-sm leading-6 text-muted">{product.description}</p>
                    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Product features">
                      {product.features.map((feature) => (
                        <li key={feature} className="rounded-lg bg-[#f5f7f5] px-2.5 py-1.5 text-xs text-[#56635a]">{feature}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {!recommendedProducts && !isLoading && (
          <section className="mt-16 border-t border-[#e5eae6] pt-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">A little inspiration</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">Explore the collection</h2>
              </div>
              <span className="text-sm text-muted">{products.length} products</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {products.slice(0, 4).map((product) => (
                <article key={product.id} className="rounded-2xl border border-[#e5eae6] bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted">{product.category}</span>
                    <span className="text-xs font-semibold">{formatPrice(product.price)}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-medium">{product.name}</h3>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-16 text-center text-xs text-[#8a968e]">A small collection. A smarter way to choose.</footer>
      </div>
    </main>
  );
}

export default App;

