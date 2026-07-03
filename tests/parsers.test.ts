import { describe, expect, it } from "vitest";
import { parseHome } from "../src/scrapers/home.js";
import { parseAnimeList, parseGenres, parseSchedule } from "../src/scrapers/list.js";
import { parseSearch } from "../src/scrapers/search.js";

const homeHtml = `
  <html>
    <body>
      <div class="block">
        <h2>On-going Anime</h2>
        <div class="venz"><ul>
          <li>
            <a href="/anime/foo-bar/" title="Foo Bar"><img src="/foo.jpg" /></a>
            <h2>Foo Bar</h2>
            <div class="epz">Episode 1</div>
            <div class="epztipe">Jumat</div>
            <div class="newnime">03 Jul</div>
          </li>
        </ul></div>
      </div>
      <div class="block">
        <h2>Complete Anime</h2>
        <div class="venz"><ul>
          <li>
            <a href="/anime/baz-qux/" title="Baz Qux"><img data-src="/baz.jpg" /></a>
            <h2>Baz Qux</h2>
            <span>12 Episode</span>
            <span>Score 7.11</span>
            <div class="newnime">02 Jul</div>
          </li>
        </ul></div>
      </div>
    </body>
  </html>
`;

const listHtml = `
  <div class="bariskel">
    <a href="/anime/foo-bar/">Foo Bar</a>
    <a href="/anime/foo-bar/">Foo Bar</a>
    <a href="/anime/baz-qux/">Baz Qux</a>
  </div>
`;

const genreHtml = `
  <a href="/genres/action/">Action</a>
  <a href="/genre/comedy/">Comedy</a>
`;

const scheduleHtml = `
  <h2>Senin</h2>
  <ul><li><a href="/anime/foo-bar/">Foo Bar</a></li></ul>
  <h2>Jumat</h2>
  <ul><li><a href="/anime/baz-qux/">Baz Qux</a></li></ul>
`;

const searchHtml = `
  <h1>Hasil Pencarian</h1>
  <ul>
    <li>
      <a href="/episode/foo-bar-episode-12-sub-indo/">Foo Bar Episode 12 Subtitle Indonesia</a>
      <span>Status : Ongoing</span>
      <span>Rating : 7.80</span>
    </li>
    <li>
      <a href="/anime/baz-qux/">Baz Qux</a>
      <span>Status : Completed</span>
      <span>Rating : 8.20</span>
    </li>
    <li><a href="/genre/action/">Action</a></li>
  </ul>
`;

describe("parsers", () => {
  it("parses homepage ongoing and completed sections", () => {
    const data = parseHome(homeHtml);

    expect(data.ongoing_anime).toHaveLength(1);
    expect(data.ongoing_anime[0]).toMatchObject({
      title: "Foo Bar",
      slug: "foo-bar",
      episode: "Episode 1",
      release_day: "Jumat",
      release_date: "03 Jul",
    });
    expect(data.complete_anime).toHaveLength(1);
    expect(data.complete_anime[0]).toMatchObject({
      title: "Baz Qux",
      slug: "baz-qux",
      total_episodes: "12 Episode",
      score: "7.11",
      completed_date: "02 Jul",
    });
  });

  it("parses and deduplicates anime list links", () => {
    expect(parseAnimeList(listHtml)).toEqual([
      { title: "Foo Bar", slug: "foo-bar", url: "https://otakudesu.blog/anime/foo-bar/" },
      { title: "Baz Qux", slug: "baz-qux", url: "https://otakudesu.blog/anime/baz-qux/" },
    ]);
  });

  it("parses genre links", () => {
    expect(parseGenres(genreHtml)).toEqual([
      { title: "Action", slug: "action", url: "https://otakudesu.blog/genres/action/" },
      { title: "Comedy", slug: "comedy", url: "https://otakudesu.blog/genre/comedy/" },
    ]);
  });

  it("parses schedule groups", () => {
    expect(parseSchedule(scheduleHtml)).toEqual([
      {
        day: "Senin",
        anime: [{ title: "Foo Bar", slug: "foo-bar", url: "https://otakudesu.blog/anime/foo-bar/" }],
      },
      {
        day: "Jumat",
        anime: [{ title: "Baz Qux", slug: "baz-qux", url: "https://otakudesu.blog/anime/baz-qux/" }],
      },
    ]);
  });

  it("parses search results", () => {
    expect(parseSearch(searchHtml)).toEqual([
      {
        title: "Foo Bar Episode 12 Subtitle Indonesia",
        slug: "foo-bar-episode-12-sub-indo",
        url: "https://otakudesu.blog/episode/foo-bar-episode-12-sub-indo/",
        type: "episode",
        episode: 12,
        status: "Ongoing",
        rating: "7.80",
      },
      {
        title: "Baz Qux",
        slug: "baz-qux",
        url: "https://otakudesu.blog/anime/baz-qux/",
        type: "anime",
        episode: null,
        status: "Completed",
        rating: "8.20",
      },
    ]);
  });
});
