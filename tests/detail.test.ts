import { describe, expect, it } from "vitest";
import { parseAnimeDetail, parseBatchDetail, parseCompleteDownloads, parseEpisodeDetail } from "../src/scrapers/detail.js";

const animeHtml = `
  <h1>Aho Girl (Episode 1 – 12) Subtitle Indonesia</h1>
  <img class="wp-post-image" src="/wp-content/uploads/aho.jpg" />
  <div class="infozingle">
    <p><span><b>Judul</b>: Aho Girl</span></p>
    <p><span><b>Japanese</b>: アホガール</span></p>
    <p><span><b>Skor</b>: 7.39</span></p>
    <p><span><b>Produser</b>: Nihon Ad Systems</span></p>
    <p><span><b>Tipe</b>: TV</span></p>
    <p><span><b>Status</b>: Completed</span></p>
    <p><span><b>Total Episode</b>: 12</span></p>
    <p><span><b>Durasi</b>: 12 Menit</span></p>
    <p><span><b>Tanggal Rilis</b>: Jul 4, 2017</span></p>
    <p><span><b>Studio</b>: Diomedea</span></p>
    <p><span><b>Genre</b>: <a href="/genres/comedy/">Comedy</a>, <a href="/genres/school/">School</a></span></p>
  </div>
  <div class="sinopc"><p>Sinopsis pertama.</p><p>Sinopsis kedua.</p></div>
  <div class="episodelist"><div class="smokelister"><span class="monktit">Aho Girl Batch</span></div><ul>
    <li><span><a href="/batch/ahgr-batch-sub-indo/">Aho Girl [BATCH] Subtitle Indonesia</a></span><span class="zeebr">17 Januari,2019</span></li>
  </ul></div>
  <div class="episodelist"><div class="smokelister"><span class="monktit">Aho Girl Episode List</span></div><ul>
    <li><span><a href="/episode/ahgr-episode-2-sub-indo/">Aho Girl Episode 2 Subtitle Indonesia</a></span><span class="zeebr">18 Januari,2019</span></li>
    <li><span><a href="/episode/ahgr-episode-1-sub-indo/">Aho Girl Episode 1 Subtitle Indonesia</a></span><span class="zeebr">17 Januari,2019</span></li>
  </ul></div>
  <div class="episodelist"><div class="smokelister"><span class="monktit">Download Lengkap</span></div><ul>
    <li><span><a href="/lengkap/ahgr-sub-indo/">Aho Girl Sub Indo : Episode 1 – 12 (End)</a></span><span class="zeebr">17 Januari,2019</span></li>
  </ul></div>
`;

const episodeHtml = `
  <h1 class="posttl">Aho Girl Episode 12 (End) Subtitle Indonesia</h1>
  <select id="selectcog">
    <option value="0">Pilih Episode Lainnya</option>
    <option value="https://otakudesu.blog/episode/ahgr-episode-12-sub-indo/">Episode 12</option>
    <option value="https://otakudesu.blog/episode/ahgr-episode-11-sub-indo/">Episode 11</option>
  </select>
  <a href="/anime/aho-girl-subtitle-indonesia/">Lihat Semua Episode</a>
  <div class="responsive-embed-stream"><iframe src="https://desustream.info/embed/abc"></iframe></div>
  <div class="mirrorstream">
    <ul class="m360p">Mirror 360p<li><a href="#" data-content="token360">solidfiles</a></li></ul>
    <ul class="m480p">Mirror 480p<li><a href="#" data-content="token480" data-default="true">desudesu</a></li></ul>
  </div>
  <div class="download"><h4>Aho Girl Episode 12 (End) Subtitle Indonesia</h4><ul>
    <li><strong>360p</strong> <a href="https://link.desustream.com/?id=abc">Mega</a> <a href="https://link.desustream.com/?id=def">Racaty</a> <i>30.7 MB</i></li>
  </ul></div>
`;

const batchHtml = `
  <h1>Aho Girl [BATCH] Subtitle Indonesia</h1>
  <img class="wp-post-image" src="/wp-content/uploads/aho.jpg" />
  <div class="animeinfo"><div class="data"><div class="infos"><b>Judul</b>: Aho Girl<br><b>Type</b>: TV<br><b>Rating</b>: 7.39</div></div></div>
  <a href="/anime/aho-girl-subtitle-indonesia/">Aho Girl</a>
  <div class="download2"><div class="batchlink"><h4>Aho Girl Batch Subtitle Indonesia</h4><ul>
    <li><strong>720p MP4</strong> <a href="https://link.desustream.com/?id=batch">Mega</a> <i>1.02 GB</i></li>
  </ul></div></div>
`;

const completeHtml = `
  <h1>Aho Girl Sub Indo : Episode 1 – 12 (End)</h1>
  <div class="animeinfo"><div class="data"><div class="infos"><b>Judul</b>: Aho Girl<br><b>Type</b>: TV</div></div></div>
  <a href="/anime/aho-girl-subtitle-indonesia/">Aho Girl</a>
  <div class="download">
    <h4>Aho Girl Episode 1 Subtitle Indonesia</h4><ul>
      <li><strong>360p</strong> <a href="https://link.desustream.com/?id=e1">Mega</a> <i>28.3 MB</i></li>
    </ul>
    <h4>Aho Girl Batch Subtitle Indonesia</h4><ul>
      <li><strong>720p MP4</strong> <a href="https://link.desustream.com/?id=batch">Mega</a> <i>1.02 GB</i></li>
    </ul>
  </div>
`;

describe("detail parsers", () => {
  it("parses anime detail", () => {
    const data = parseAnimeDetail(animeHtml, "/anime/aho-girl-subtitle-indonesia/");

    expect(data).toMatchObject({
      title: "Aho Girl",
      slug: "aho-girl-subtitle-indonesia",
      score: "7.39",
      status: "Completed",
      total_episodes: "12",
      synopsis: "Sinopsis pertama. Sinopsis kedua.",
    });
    expect(data.genres).toHaveLength(2);
    expect(data.batch?.slug).toBe("ahgr-batch-sub-indo");
    expect(data.complete_download?.slug).toBe("ahgr-sub-indo");
    expect(data.episodes.map((episode) => episode.episode)).toEqual([2, 1]);
  });

  it("parses episode detail", () => {
    const data = parseEpisodeDetail(episodeHtml, "/episode/ahgr-episode-12-sub-indo/");

    expect(data.title).toBe("Aho Girl Episode 12 (End) Subtitle Indonesia");
    expect(data.episode).toBe(12);
    expect(data.stream_url).toBe("https://desustream.info/embed/abc");
    expect(data.mirrors).toEqual([
      { quality: "360p", providers: [{ name: "solidfiles", data_content: "token360", is_default: false }] },
      { quality: "480p", providers: [{ name: "desudesu", data_content: "token480", is_default: true }] },
    ]);
    expect(data.downloads[0]).toMatchObject({ quality: "360p", size: "30.7 MB" });
    expect(data.downloads[0].links).toHaveLength(2);
    expect(data.previous_episode?.episode).toBe(11);
    expect(data.next_episode).toBeNull();
  });

  it("parses batch detail", () => {
    const data = parseBatchDetail(batchHtml, "/batch/ahgr-batch-sub-indo/");

    expect(data.title).toBe("Aho Girl [BATCH] Subtitle Indonesia");
    expect(data.anime?.slug).toBe("aho-girl-subtitle-indonesia");
    expect(data.downloads).toEqual([
      {
        quality: "720p MP4",
        size: "1.02 GB",
        links: [{ provider: "Mega", url: "https://link.desustream.com/?id=batch" }],
      },
    ]);
  });

  it("parses complete downloads", () => {
    const data = parseCompleteDownloads(completeHtml, "/lengkap/ahgr-sub-indo/");

    expect(data.episodes).toHaveLength(1);
    expect(data.episodes[0]).toMatchObject({ episode: 1, title: "Aho Girl Episode 1 Subtitle Indonesia" });
    expect(data.batch).toEqual([
      {
        quality: "720p MP4",
        size: "1.02 GB",
        links: [{ provider: "Mega", url: "https://link.desustream.com/?id=batch" }],
      },
    ]);
  });
});
