function createStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => {
      store.clear()
    },
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
  }
}

function install(key: 'localStorage' | 'sessionStorage') {
  // Node 26 espone localStorage/sessionStorage come getter sperimentale che
  // torna `undefined` senza --localstorage-file, e vitest 4 non li eredita
  // da happy-dom su questa macchina → polyfill deterministico in-memory.
  if (typeof (globalThis as Record<string, unknown>)[key] === 'undefined') {
    try {
      Object.defineProperty(globalThis, key, {
        value: createStorage(),
        configurable: true,
        writable: true,
      })
    } catch {
      ;(globalThis as Record<string, unknown>)[key] = createStorage()
    }
  }
}

install('localStorage')
install('sessionStorage')
