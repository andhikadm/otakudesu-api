# Otakudesu API

Read-only API wrapper untuk `https://otakudesu.blog/`. API ini mengambil data dari halaman publik Otakudesu, mem-parse HTML, lalu mengembalikannya sebagai JSON yang konsisten.

## Fitur

- Latest anime dari homepage.
- Search anime (series only, bukan episode).
- Ongoing anime dengan pagination.
- Completed anime dengan pagination.
- Anime list.
- Genre list.
- Jadwal rilis.
- Detail anime.
- Detail episode termasuk stream iframe, mirror, dan link download.
- Detail batch download.
- Complete downloads untuk semua episode dan batch.
- In-memory cache, rate limiting, CORS headers, dan health check.

## Requirements

- Node.js `>=20`
- npm

## Instalasi

```bash
npm install
```

## Menjalankan Project

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

Default server berjalan di:

```text
http://localhost:3000
```

## Environment Variables

| Variable | Default | Deskripsi |
| --- | --- | --- |
| `PORT` | `3000` | Port server API (`1-65535`). |
| `OTAKUDESU_BASE_URL` | `https://otakudesu.blog` | Base URL target Otakudesu. |
| `REQUEST_TIMEOUT_MS` | `15000` | Timeout request ke situs target dalam milidetik. |
| `CACHE_TTL_MS` | `300000` | TTL cache HTML in-memory (`0` = disable). |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Jendela rate limit per IP. |
| `RATE_LIMIT_MAX` | `60` | Maks request per IP dalam satu jendela. |
| `CORS_ORIGIN` | `*` | Nilai header `Access-Control-Allow-Origin`. |

Contoh:

```bash
PORT=4000 npm start
```

Di PowerShell:

```powershell
$env:PORT = "4000"; npm start
```

## Response Format

Semua response sukses menggunakan format:

```json
{
  "ok": true,
  "data": {}
}
```

Beberapa endpoint menambahkan metadata tambahan seperti `page` atau `query`:

```json
{
  "ok": true,
  "data": [],
  "page": 1
}
```

Response error:

```json
{
  "ok": false,
  "error": "Error message"
}
```

## Endpoints

### Service Metadata

```http
GET /
```

Mengembalikan nama service, deskripsi, dan daftar endpoint.

Contoh:

```bash
curl http://localhost:3000/
```

---

### Health

```http
GET /health
```

Health check ringan tanpa scrape upstream.

Contoh:

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "ok": true,
  "data": {
    "status": "up"
  }
}
```

---

### Latest

```http
GET /api/latest
```

Mengambil data terbaru dari homepage.

Response `data`:

```ts
{
  ongoing_anime: AnimeCard[];
  complete_anime: AnimeCard[];
}
```

`AnimeCard`:

```ts
{
  title: string;
  slug: string;
  url: string;
  image_url: string | null;
  episode?: string | null;
  release_day?: string | null;
  release_date?: string | null;
  total_episodes?: string | null;
  score?: string | null;
  completed_date?: string | null;
}
```

Contoh:

```bash
curl http://localhost:3000/api/latest
```

---

### Search

```http
GET /api/search?q=keyword
```

Mencari series anime berdasarkan keyword. Endpoint ini otomatis memakai `post_type=anime` saat request ke Otakudesu sehingga hasil episode tidak dikembalikan.

Query params:

| Param | Wajib | Deskripsi |
| --- | --- | --- |
| `q` | Ya | Keyword pencarian. |

Contoh:

```bash
curl "http://localhost:3000/api/search?q=naruto"
```

Response `data`:

```ts
Array<{
  title: string;
  slug: string;
  url: string;
  type: "anime";
  image_url: string | null;
  genres: LinkItem[];
  status: string | null;
  rating: string | null;
}>
```

---

### Ongoing Anime

```http
GET /api/ongoing?page=1
```

Mengambil daftar ongoing anime.

Query params:

| Param | Default | Deskripsi |
| --- | --- | --- |
| `page` | `1` | Nomor halaman. |

Contoh:

```bash
curl "http://localhost:3000/api/ongoing?page=1"
```

Response `data` adalah `AnimeCard[]`.

---

### Completed Anime

```http
GET /api/completed?page=1
```

Mengambil daftar completed anime.

Query params:

| Param | Default | Deskripsi |
| --- | --- | --- |
| `page` | `1` | Nomor halaman. |

Contoh:

```bash
curl "http://localhost:3000/api/completed?page=1"
```

Response `data` adalah `AnimeCard[]`.

---

### Anime List

```http
GET /api/anime-list
```

Mengambil daftar anime dari halaman anime list.

Contoh:

```bash
curl http://localhost:3000/api/anime-list
```

Response `data`:

```ts
Array<{
  title: string;
  slug: string;
  url: string;
}>
```

---

### Genres

```http
GET /api/genres
```

Mengambil daftar genre.

Contoh:

```bash
curl http://localhost:3000/api/genres
```

Response `data`:

```ts
Array<{
  title: string;
  slug: string;
  url: string;
}>
```

---

### Schedule

```http
GET /api/schedule
```

Mengambil jadwal rilis anime.

Contoh:

```bash
curl http://localhost:3000/api/schedule
```

Response `data`:

```ts
Array<{
  day: string;
  anime: Array<{
    title: string;
    slug: string;
    url: string;
  }>;
}>
```

---

## Detail Endpoints

### Anime Detail

```http
GET /api/anime/:slug
```

Mengambil detail anime dari halaman `/anime/{slug}/`.

Contoh:

```bash
curl http://localhost:3000/api/anime/aho-girl-subtitle-indonesia
```

Response `data`:

```ts
{
  title: string;
  slug: string;
  url: string;
  image_url: string | null;
  japanese: string | null;
  score: string | null;
  producer: string | null;
  type: string | null;
  status: string | null;
  total_episodes: string | null;
  duration: string | null;
  release_date: string | null;
  studio: string | null;
  genres: LinkItem[];
  synopsis: string;
  batch: EpisodeListItem | null;
  complete_download: EpisodeListItem | null;
  episodes: EpisodeListItem[];
}
```

Contoh field penting:

```json
{
  "title": "Aho Girl",
  "score": "7.39",
  "status": "Completed",
  "total_episodes": "12",
  "batch": {
    "title": "Aho Girl [BATCH] Subtitle Indonesia",
    "slug": "ahgr-batch-sub-indo",
    "url": "https://otakudesu.blog/batch/ahgr-batch-sub-indo/",
    "episode": null,
    "date": "17 Januari,2019"
  },
  "complete_download": {
    "title": "Aho Girl Sub Indo : Episode 1 – 12 (End)",
    "slug": "ahgr-sub-indo",
    "url": "https://otakudesu.blog/lengkap/ahgr-sub-indo/",
    "episode": null,
    "date": "17 Januari,2019"
  }
}
```

Catatan: endpoint ini tidak mengambil isi semua halaman episode agar tetap cepat. Untuk stream/download, gunakan endpoint episode, batch, atau complete downloads.

---

### Episode Detail

```http
GET /api/episode/:slug
```

Mengambil detail satu episode, termasuk stream iframe, mirror, dan download links.

Contoh:

```bash
curl http://localhost:3000/api/episode/ahgr-episode-12-sub-indo
```

Response `data`:

```ts
{
  title: string;
  slug: string;
  url: string;
  episode: number | null;
  anime: LinkItem | null;
  stream_url: string | null;
  mirrors: Array<{
    quality: string;
    providers: Array<{
      name: string;
      data_content: string | null;
      is_default: boolean;
    }>;
  }>;
  downloads: DownloadQuality[];
  episode_selector: EpisodeListItem[];
  previous_episode: EpisodeListItem | null;
  next_episode: EpisodeListItem | null;
  all_episodes: EpisodeListItem | null;
}
```

`DownloadQuality`:

```ts
{
  quality: string;
  size: string | null;
  links: Array<{
    provider: string;
    url: string;
  }>;
}
```

Contoh download item:

```json
{
  "quality": "720p",
  "size": "91.1 MB",
  "links": [
    {
      "provider": "Mega",
      "url": "https://link.desustream.com/?id=..."
    }
  ]
}
```

---

### Batch Detail

```http
GET /api/batch/:slug
```

Mengambil metadata dan link download batch.

Contoh:

```bash
curl http://localhost:3000/api/batch/ahgr-batch-sub-indo
```

Response `data`:

```ts
{
  title: string;
  slug: string;
  url: string;
  anime: LinkItem | null;
  image_url: string | null;
  metadata: Record<string, string>;
  downloads: DownloadQuality[];
}
```

---

### Complete Downloads

```http
GET /api/complete-downloads/:slug
```

Mengambil semua link download episode dan batch dari halaman `/lengkap/{slug}/`.

Contoh:

```bash
curl http://localhost:3000/api/complete-downloads/ahgr-sub-indo
```

Response `data`:

```ts
{
  title: string;
  slug: string;
  url: string;
  anime: LinkItem | null;
  metadata: Record<string, string>;
  episodes: Array<{
    episode: number | null;
    title: string;
    is_final: boolean;
    downloads: DownloadQuality[];
  }>;
  batch: DownloadQuality[];
}
```

---

## Shared Types

```ts
interface LinkItem {
  title: string;
  slug: string;
  url: string;
}

interface EpisodeListItem extends LinkItem {
  episode: number | null;
  date: string | null;
}

interface DownloadLink {
  provider: string;
  url: string;
}

interface DownloadQuality {
  quality: string;
  size: string | null;
  links: DownloadLink[];
}
```

## Slug Rules

Endpoint dengan `:slug` hanya menerima karakter berikut:

```text
a-z A-Z 0-9 _ -
```

Jika slug tidak valid, API mengembalikan:

```json
{
  "ok": false,
  "error": "Invalid slug"
}
```

## Catatan Download Links

Link download dari Otakudesu biasanya memakai redirect/protection layer seperti:

```text
https://link.desustream.com/?id=...
```

API ini hanya mengembalikan URL tersebut apa adanya. API tidak melakukan bypass, decode, atau follow redirect download.

## Testing

Menjalankan test:

```bash
npm test
```

Build TypeScript:

```bash
npm run build
```

## Project Structure

```text
src/
  app.ts
  config.ts
  server.ts
  types.ts
  lib/
    cache.ts
    http.ts
    logger.ts
    text.ts
    url.ts
  middleware/
    rateLimit.ts
    requestLog.ts
    security.ts
  routes/
    index.ts
  scrapers/
    cards.ts
    detail.ts
    home.ts
    list.ts
    search.ts
tests/
  cache.test.ts
  detail.test.ts
  parsers.test.ts
  routes.test.ts
  url.test.ts
```

## Disclaimer

Repository ini disediakan semata-mata untuk tujuan edukasi dan penelitian. Proyek ini bertujuan untuk menunjukkan bagaimana data publik dari situs pihak ketiga dapat diakses, diproses, dan disajikan kembali melalui API yang terstruktur. Repository ini tidak menyimpan konten berhak cipta, tidak mendorong pelanggaran terhadap ketentuan layanan situs sumber, dan tidak boleh digunakan untuk kegiatan yang melanggar hukum, kebijakan, atau hak pengguna lain. Pengguna bertanggung jawab penuh atas pemanfaatan proyek ini sesuai dengan peraturan dan ketentuan yang berlaku.