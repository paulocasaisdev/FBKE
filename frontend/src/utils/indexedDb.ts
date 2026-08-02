/**
 * Utilitário de IndexedDB para a persistência offline-first do Placar de Karatê (FBKE)
 */

export interface OfflineMatch {
  id: string;
  category_id: string;
  round_number: number;
  match_number: number;
  athlete_red_id: string | null;
  athlete_red_name: string | null;
  athlete_blue_id: string | null;
  athlete_blue_name: string | null;
  winner_id: string | null;
  score_red: number;
  score_blue: number;
  status: 'scheduled' | 'ongoing' | 'finished' | 'bye';
  match_order: number;
  parent_red_match_id: string | null;
  parent_blue_match_id: string | null;
  dojo_name?: string | null;
}

export interface OfflineMatchLog {
  id?: string;
  match_id: string;
  timestamp: string;
  log_type: 'score' | 'penalty' | 'senshu' | 'timer' | 'system';
  details: any;
}

export interface SyncQueueItem {
  id: number;
  type: 'match_update' | 'match_log';
  payload: any;
}

export class KarateIndexedDB {
  private dbName = 'fbke_tournament_db';
  private version = 1;

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject('IndexedDB só pode ser usado no navegador.');
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject('Erro ao abrir o IndexedDB.');
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Loja de Lutas/Confrontos
        if (!db.objectStoreNames.contains('matches')) {
          db.createObjectStore('matches', { keyPath: 'id' });
        }
        
        // Loja de Logs das Lutas
        if (!db.objectStoreNames.contains('match_logs')) {
          const logStore = db.createObjectStore('match_logs', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('match_id', 'match_id', { unique: false });
        }
        
        // Fila de Sincronização
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // --- MÉTODOS DE PARTIDAS (MATCHES) ---
  
  async saveMatches(matches: OfflineMatch[]): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('matches', 'readwrite');
      const store = tx.objectStore('matches');
      
      matches.forEach(match => {
        store.put(match);
      });
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject('Erro ao salvar partidas no IndexedDB.');
    });
  }

  async getMatchesByCategory(categoryId: string): Promise<OfflineMatch[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('matches', 'readonly');
      const store = tx.objectStore('matches');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allMatches = request.result as OfflineMatch[];
        const filtered = allMatches.filter(m => m.category_id === categoryId);
        resolve(filtered.sort((a, b) => a.match_order - b.match_order));
      };
      
      request.onerror = () => reject('Erro ao buscar partidas por categoria.');
    });
  }

  async getMatch(matchId: string): Promise<OfflineMatch | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('matches', 'readonly');
      const store = tx.objectStore('matches');
      const request = store.get(matchId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject('Erro ao buscar partida.');
    });
  }

  async updateMatchLocal(matchId: string, updates: Partial<OfflineMatch>): Promise<OfflineMatch> {
    const match = await this.getMatch(matchId);
    if (!match) throw new Error('Partida não encontrada localmente.');
    
    const updatedMatch = { ...match, ...updates };
    await this.saveMatches([updatedMatch]);
    
    // Adiciona na fila de sincronização
    await this.addToSyncQueue('match_update', { id: matchId, ...updates });
    
    return updatedMatch;
  }

  // --- MÉTODOS DE LOGS ---

  async saveMatchLogLocal(log: OfflineMatchLog): Promise<void> {
    const db = await this.openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['match_logs'], 'readwrite');
      const store = tx.objectStore('match_logs');
      store.add(log);
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject('Erro ao salvar log local.');
    }).then(async () => {
      // Adiciona na fila de sincronização
      await this.addToSyncQueue('match_log', log);
    });
  }

  async getMatchLogs(matchId: string): Promise<OfflineMatchLog[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('match_logs', 'readonly');
      const store = tx.objectStore('match_logs');
      const index = store.index('match_id');
      const request = index.getAll(IDBKeyRange.only(matchId));
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Erro ao carregar logs da partida.');
    });
  }

  // --- MÉTODOS DE FILA DE SINCRONIZAÇÃO (SYNC QUEUE) ---

  async addToSyncQueue(type: 'match_update' | 'match_log', payload: any): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      store.add({ type, payload });
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject('Erro ao adicionar item na fila de sync.');
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Erro ao buscar fila de sync.');
    });
  }

  async removeSyncQueueItem(id: number): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      store.delete(id);
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject('Erro ao deletar item da fila de sync.');
    });
  }
}

export const karateDb = new KarateIndexedDB();
